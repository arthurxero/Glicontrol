"use client";
import styles from './styleAccount.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../services/firebaseConfig';

interface UserData {
  nome: string;
  sobrenome: string;
  email: string;
  dataNascimento: string;
  altura: string;
  peso: number;
  idade: string;
  fatorInsulina: number;
  glicemiaAlvo: number;
  photoURL?: string; // Usado internamente para exibir a foto, mapeado de fotoPerfil
}

interface DailyRecord {
  meal: string;
  calories: number;
  carbs: number;
}

export default function Profile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para o sistema de foto
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          console.log('Buscando dados para o usuário:', currentUser.uid);
          
          // Primeiro, tentar buscar dados do documento principal do usuário
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          let mainUserData: any = {};
          
          if (userDoc.exists()) {
            mainUserData = userDoc.data();
            console.log('Dados do documento principal:', mainUserData);
          }

          // Buscar dados do perfil/dados
          const perfilDoc = await getDoc(doc(db, 'users', currentUser.uid, 'perfil', 'dados'));
          let perfilData: any = {};
          
          if (perfilDoc.exists()) {
            perfilData = perfilDoc.data();
            console.log('Dados do perfil:', perfilData);
          }

          // Buscar dados da coleção 'dados' (baseado na estrutura mostrada no Firestore)
          const dadosDoc = await getDoc(doc(db, 'users', currentUser.uid, 'dados', 'dados'));
          let dadosData: any = {};
          
          if (dadosDoc.exists()) {
            dadosData = dadosDoc.data();
            console.log('Dados da coleção dados:', dadosData);
          }
          
          // Combinar todos os dados disponíveis, priorizando dados mais específicos
          const combinedData = {
            nome: dadosData.nome || perfilData.nome || mainUserData.nome || '',
            sobrenome: dadosData.sobrenome || perfilData.sobrenome || mainUserData.sobrenome || '',
            email: dadosData.email || perfilData.email || mainUserData.email || currentUser.email || '',
            dataNascimento: dadosData.dataNascimento || perfilData.dataNascimento || mainUserData.dataNascimento || '',
            altura: dadosData.altura || perfilData.altura || mainUserData.altura || '',
            peso: dadosData.peso || perfilData.peso || mainUserData.peso || 0,
            idade: dadosData.idade || perfilData.idade || mainUserData.idade || '',
            fatorInsulina: dadosData.fatorInsulina || perfilData.fatorInsulina || mainUserData.fatorInsulina || 0,
            glicemiaAlvo: dadosData.glicemiaAlvo || perfilData.glicemiaAlvo || mainUserData.glicemiaAlvo || 0,
            // Priorizar fotoPerfil do Firestore, depois photoURL
            photoURL: dadosData.fotoPerfil || dadosData.photoURL || perfilData.photoURL || mainUserData.photoURL || currentUser.photoURL || '',
          };
          
          setUserData(combinedData as UserData);
          console.log('Dados combinados finais:', combinedData);
          
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Funções para o sistema de foto de perfil
  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      setSelectedFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Criar referência para o arquivo no Storage
      const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${selectedFile.name}`);
      
      // Upload do arquivo
      const snapshot = await uploadBytes(photoRef, selectedFile);
      
      // Obter URL de download
      const photoURL = await getDownloadURL(snapshot.ref);
      
      // Atualizar em múltiplas localizações no Firestore para garantir consistência
      const updatePromises = [];
      
      // Atualizar documento principal do usuário
      updatePromises.push(
        updateDoc(doc(db, 'users', user.uid), {
          photoURL: photoURL
        }).catch(error => console.log('Erro ao atualizar documento principal:', error))
      );
      
      // Atualizar documento de perfil
      updatePromises.push(
        updateDoc(doc(db, 'users', user.uid, 'perfil', 'dados'), {
          photoURL: photoURL
        }).catch(error => console.log('Erro ao atualizar perfil:', error))
      );
      
      // Atualizar documento de dados (que é o que você mostrou no Firestore)
      // Usamos apenas 'fotoPerfil' aqui, conforme seu screenshot
      updatePromises.push(
        updateDoc(doc(db, 'users', user.uid, 'dados', 'dados'), {
          fotoPerfil: photoURL,
        }).catch(error => console.log('Erro ao atualizar dados:', error))
      );

      // Executar todas as atualizações
      await Promise.all(updatePromises);

      // Atualizar estado local
      setUserData(prev => prev ? { ...prev, photoURL } : null);
      
      // Fechar modal e limpar estados
      setShowPhotoModal(false);
      setPhotoPreview(null);
      setSelectedFile(null);
      
      alert('Foto de perfil atualizada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro ao atualizar foto de perfil. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !userData?.photoURL) return;

    try {
      // Remover foto do Storage
      if (userData.photoURL.includes('firebase') || userData.photoURL.includes('storage.googleapis')) {
        try {
          const photoRef = ref(storage, userData.photoURL);
          await deleteObject(photoRef);
        } catch (storageError) {
          console.log('Erro ao deletar do Storage (pode já ter sido deletada ou não é do Firebase Storage):', storageError);
        }
      }

      // Remover URL de múltiplas localizações no Firestore
      const updatePromises = [];
      
      // Atualizar documento principal do usuário
      updatePromises.push(
        updateDoc(doc(db, 'users', user.uid), {
          photoURL: ''
        }).catch(error => console.log('Erro ao atualizar documento principal:', error))
      );
      
      // Atualizar documento de perfil
      updatePromises.push(
        updateDoc(doc(db, 'users', user.uid, 'perfil', 'dados'), {
          photoURL: ''
        }).catch(error => console.log('Erro ao atualizar perfil:', error))
      );
      
      // Atualizar documento de dados
      // Usamos apenas 'fotoPerfil' aqui, conforme seu screenshot
      updatePromises.push(
        updateDoc(doc(db, 'users', user.uid, 'dados', 'dados'), {
          fotoPerfil: '',
        }).catch(error => console.log('Erro ao atualizar dados:', error))
      );

      // Executar todas as atualizações
      await Promise.all(updatePromises);

      // Atualizar estado local
      setUserData(prev => prev ? { ...prev, photoURL: '' } : null);
      
      setShowPhotoModal(false);
      alert('Foto de perfil removida com sucesso!');
      
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      alert('Erro ao remover foto de perfil. Tente novamente.');
    }
  };

  const cancelPhotoModal = () => {
    setShowPhotoModal(false);
    setPhotoPreview(null);
    setSelectedFile(null);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    window.location.href = '/';
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // Dados vazios para os registros diários
  const dailyRecords: DailyRecord[] = [
    { meal: 'Café', calories: 0, carbs: 0 },
    { meal: 'Almoço', calories: 0, carbs: 0 },
    { meal: 'Janta', calories: 0, carbs: 0 },
    { meal: 'Outros', calories: 0, carbs: 0 }
  ];

  const totalCalories = dailyRecords.reduce((sum, record) => sum + record.calories, 0);
  const totalCarbs = dailyRecords.reduce((sum, record) => sum + record.carbs, 0);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button 
          className={styles.menuToggle} 
          onClick={toggleMenu}
          aria-label="Menu de navegação"
        >
          ☰
        </button>
        <div className={`${styles.logoContainer} ${isLoaded ? styles.logoLoaded : ''}`}>
          <Image 
            src={glicontrolLogo} 
            alt="GliControl Logo" 
            className={styles.logo}
            priority
          />
        </div>
      </header>

      {/* Sidebar Menu */}
      <div className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <nav className={styles.sidebarNav}>
          <ul className={styles.sidebarMenu}>
            <li className={styles.sidebarItem}>
              <Link href="/dashboard" className={styles.sidebarLink}>
                Tela inicial
              </Link>
            </li>
            <li className={styles.sidebarItem}>
              <Link href="/about" className={styles.sidebarLink}>
                Sobre
              </Link>
            </li>
            <li className={styles.sidebarItem}>
              <button 
                className={styles.sidebarButton} 
                onClick={handleExitClick}
              >
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Backdrop overlay when menu is open */}
      {menuOpen && (
        <div 
          className={styles.backdrop} 
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.fadeIn}`}>
            <p className={styles.modalText}>Deseja realmente sair?</p>
            <div className={styles.modalButtons}>
              <button 
                className={`${styles.modalButton} ${styles.confirmButton}`} 
                onClick={confirmExit}
              >
                Sim
              </button>
              <button 
                className={`${styles.modalButton} ${styles.cancelButton}`} 
                onClick={cancelExit}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.photoModalContent} ${styles.fadeIn}`}>
            <h3 className={styles.photoModalTitle}>Foto de Perfil</h3>
            
            <div className={styles.photoPreviewContainer}>
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Preview da foto" 
                  className={styles.photoPreview}
                />
              ) : userData?.photoURL ? (
                <img 
                  src={userData.photoURL} 
                  alt="Foto atual" 
                  className={styles.photoPreview}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {userData?.nome?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <div className={styles.photoModalButtons}>
              <button 
                className={styles.photoButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Escolher Foto
              </button>
              
              {selectedFile && (
                <button 
                  className={`${styles.photoButton} ${styles.uploadButton}`}
                  onClick={handleUploadPhoto}
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : 'Salvar'}
                </button>
              )}
              
              {userData?.photoURL && !selectedFile && (
                <button 
                  className={`${styles.photoButton} ${styles.removeButton}`}
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  Remover Foto
                </button>
              )}
              
              <button 
                className={`${styles.photoButton} ${styles.cancelButton}`}
                onClick={cancelPhotoModal}
                disabled={uploading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={`${styles.mainContent} ${isLoaded ? styles.contentLoaded : ''}`}>
        <div className={styles.profileContainer}>
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div 
              className={styles.profileAvatarContainer}
              onClick={handlePhotoClick}
            >
              {userData?.photoURL ? (
                <img 
                  src={userData.photoURL} 
                  alt="Foto de perfil" 
                  className={styles.profileAvatarImage}
                />
              ) : (
                <div className={styles.profileAvatar}>
                  {userData?.nome?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className={styles.profileAvatarOverlay}>
                <span className={styles.cameraIcon}>📷</span>
              </div>
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>
                {userData && userData.nome && userData.sobrenome 
                  ? `${userData.nome} ${userData.sobrenome}` 
                  : userData?.nome || 'Usuário'}
              </h1>
              <p className={styles.profileEmail}>
                {userData?.email || user?.email}
              </p>
              <div className={styles.profileStats}>
                <span className={styles.profileStat}>
                  {userData?.altura ? `${userData.altura}cm` : 'Altura: -'}
                </span>
                <span className={styles.profileStat}>
                  {userData?.peso ? `${userData.peso}kg` : 'Peso: -'}
                </span>
                <span className={styles.profileStat}>
                  {userData?.idade ? `${userData.idade} anos` : 'Idade: -'}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Records */}
          <div className={styles.dailyRecord}>
            <h2 className={styles.recordTitle}>Registro diário:</h2>
            <table className={styles.recordTable}>
              <thead>
                <tr>
                  <th className={styles.recordHeader}>Café</th>
                  <th className={styles.recordHeader}>Almoço</th>
                  <th className={styles.recordHeader}>Janta</th>
                  <th className={styles.recordHeader}>Outros</th>
                  <th className={styles.recordHeader}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.recordRow}>
                  <td className={styles.recordCell}>-</td>
                  <td className={styles.recordCell}>-</td>
                  <td className={styles.recordCell}>-</td>
                  <td className={styles.recordCell}>-</td>
                  <td className={`${styles.recordCell} ${styles.totalCell}`}>
                    {totalCalories} kcal
                  </td>
                </tr>
                <tr className={styles.recordRow}>
                  <td className={styles.recordCell}>-</td>
                  <td className={styles.recordCell}>-</td>
                  <td className={styles.recordCell}>-</td>
                  <td className={styles.recordCell}>-</td>
                  <td className={`${styles.recordCell} ${styles.totalCell}`}>
                    {totalCarbs}g de carb
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* App Info */}
          <div className={styles.appInfo}>
            Para mais informações, acesse o aplicativo
          </div>
        </div>
      </main>
    </div>
  );
}
