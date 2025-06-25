"use client";
import styles from './styleAccount.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

interface UserData {
  nome: string;
  sobrenome: string;
  email: string;
  dataNascimento: string;
  altura: string;
  peso: string;
  idade: string;
  fatorInsulina: string;
  glicemiaAlvo: string;
  fotoPerfil?: string;
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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          console.log('=== INÍCIO BUSCA DE DADOS ===');
          console.log('UID do usuário:', currentUser.uid);
          
          // Buscar dados do documento principal (users/{uid})
          console.log('Buscando documento principal...');
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          let mainUserData: any = {};
          
          if (userDoc.exists()) {
            mainUserData = userDoc.data();
            console.log('✅ Documento principal encontrado:', mainUserData);
          } else {
            console.log('❌ Documento principal NÃO encontrado');
          }

          // Buscar dados do documento dados/dados
          console.log('Buscando documento dados/dados...');
          const dadosDoc = await getDoc(doc(db, 'users', currentUser.uid, 'dados', 'dados'));
          let dadosData: any = {};
          
          if (dadosDoc.exists()) {
            dadosData = dadosDoc.data();
            console.log('✅ Documento dados/dados encontrado:', dadosData);
          } else {
            console.log('❌ Documento dados/dados NÃO encontrado');
          }

          // Buscar dados do documento perfil/dados (backup)
          console.log('Buscando documento perfil/dados...');
          const perfilDoc = await getDoc(doc(db, 'users', currentUser.uid, 'perfil', 'dados'));
          let perfilData: any = {};
          
          if (perfilDoc.exists()) {
            perfilData = perfilDoc.data();
            console.log('✅ Documento perfil/dados encontrado:', perfilData);
          } else {
            console.log('❌ Documento perfil/dados NÃO encontrado');
          }
          
          // Combinar os dados, priorizando o documento dados/dados
          const combinedData = {
            nome: dadosData.nome || perfilData.nome || mainUserData.nome || '',
            sobrenome: dadosData.sobrenome || perfilData.sobrenome || mainUserData.sobrenome || '',
            email: dadosData.email || perfilData.email || mainUserData.email || currentUser.email || '',
            dataNascimento: dadosData.dataNascimento || perfilData.dataNascimento || mainUserData.dataNascimento || '',
            altura: dadosData.altura || perfilData.altura || mainUserData.altura || '',
            peso: dadosData.peso || perfilData.peso || mainUserData.peso || '',
            idade: dadosData.idade || perfilData.idade || mainUserData.idade || '',
            fatorInsulina: dadosData.fatorInsulina || perfilData.fatorInsulina || mainUserData.fatorInsulina || '',
            glicemiaAlvo: dadosData.glicemiaAlvo || perfilData.glicemiaAlvo || mainUserData.glicemiaAlvo || '',
            fotoPerfil: dadosData.fotoPerfil || perfilData.fotoPerfil || mainUserData.fotoPerfil || '',
          };
          
          console.log('=== DADOS FINAIS COMBINADOS ===');
          console.log('Nome:', combinedData.nome);
          console.log('Sobrenome:', combinedData.sobrenome);
          console.log('Altura:', combinedData.altura);
          console.log('Peso:', combinedData.peso);
          console.log('Idade:', combinedData.idade);
          console.log('Foto:', combinedData.fotoPerfil);
          console.log('================================');
          
          setUserData(combinedData as UserData);
          
        } catch (error) {
          console.error('❌ ERRO ao buscar dados do usuário:', error);
        }
      } else {
        console.log('❌ Usuário não autenticado, redirecionando...');
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Função para converter arquivo para Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Função para validar URL de imagem
  const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Funções para o sistema de foto de perfil
  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Verificar tamanho do arquivo (máximo 2MB para Base64)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB para upload direto.');
        return;
      }

      setSelectedFile(file);
      
      try {
        // Converter para Base64 para preview
        const base64String = await convertToBase64(file);
        setPhotoPreview(base64String);
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
        alert('Erro ao processar a imagem.');
      }
    }
  };

  const handleUrlInput = () => {
    setShowUrlInput(true);
    setSelectedFile(null);
    setPhotoPreview(null);
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
  };

  const handleUrlPreview = async () => {
    if (!imageUrl.trim()) {
      alert('Por favor, digite uma URL válida.');
      return;
    }

    try {
      const isValid = await validateImageUrl(imageUrl);
      if (isValid) {
        setPhotoPreview(imageUrl);
        setSelectedFile(null);
      } else {
        alert('URL inválida ou imagem não encontrada.');
      }
    } catch (error) {
      alert('Erro ao validar a URL da imagem.');
    }
  };

  const handleSavePhoto = async () => {
    if (!user) {
      alert('Usuário não encontrado');
      return;
    }

    let photoDataToSave = '';

    // Se tem arquivo selecionado, converter para Base64
    if (selectedFile) {
      try {
        photoDataToSave = await convertToBase64(selectedFile);
      } catch (error) {
        console.error('Erro ao converter arquivo:', error);
        alert('Erro ao processar a imagem.');
        return;
      }
    }
    // Se tem URL, usar a URL
    else if (imageUrl.trim()) {
      const isValid = await validateImageUrl(imageUrl);
      if (!isValid) {
        alert('URL da imagem é inválida.');
        return;
      }
      photoDataToSave = imageUrl.trim();
    }
    // Se tem preview (de URL), usar o preview
    else if (photoPreview) {
      photoDataToSave = photoPreview;
    }

    if (!photoDataToSave) {
      alert('Nenhuma imagem selecionada.');
      return;
    }

    console.log('=== INÍCIO SALVAMENTO FOTO ===');
    console.log('Usuário:', user.uid);
    console.log('Tipo de dados:', selectedFile ? 'Arquivo Base64' : 'URL');

    setUploading(true);
    try {
      // Atualizar Firestore
      console.log('Atualizando Firestore...');
      
      const updateData = {
        fotoPerfil: photoDataToSave,
        fotoPerfilUpdatedAt: new Date().toISOString()
      };
      
      // Atualizar documento dados/dados (principal)
      try {
        const dadosDocRef = doc(db, 'users', user.uid, 'dados', 'dados');
        await setDoc(dadosDocRef, updateData, { merge: true });
        console.log('✅ Documento dados/dados atualizado');
      } catch (error) {
        console.log('❌ Erro ao atualizar dados/dados:', error);
      }

      // Backup: Atualizar documento principal
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, updateData, { merge: true });
        console.log('✅ Documento principal atualizado');
      } catch (error) {
        console.log('❌ Erro ao atualizar documento principal:', error);
      }

      // Atualizar estado local
      setUserData(prev => prev ? { ...prev, fotoPerfil: photoDataToSave } : null);
      
      // Fechar modal e limpar estados
      setShowPhotoModal(false);
      setPhotoPreview(null);
      setSelectedFile(null);
      setImageUrl('');
      setShowUrlInput(false);
      
      console.log('=== SALVAMENTO CONCLUÍDO COM SUCESSO ===');
      alert('Foto de perfil atualizada com sucesso!');
      
    } catch (error) {
      console.error('❌ ERRO COMPLETO no salvamento:', error);
      alert('Erro ao atualizar foto de perfil. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    setUploading(true);
    try {
      // Remover URL dos documentos
      const removeData = {
        fotoPerfil: '',
        fotoPerfilRemovedAt: new Date().toISOString()
      };

      // Remover do documento dados/dados
      try {
        await setDoc(doc(db, 'users', user.uid, 'dados', 'dados'), removeData, { merge: true });
        console.log('✅ Referência removida do dados/dados');
      } catch (error) {
        console.log('❌ Erro ao atualizar dados/dados:', error);
      }

      // Remover do documento principal
      try {
        await setDoc(doc(db, 'users', user.uid), removeData, { merge: true });
        console.log('✅ Referência removida do documento principal');
      } catch (error) {
        console.log('❌ Erro ao atualizar documento principal:', error);
      }

      // Atualizar estado local
      setUserData(prev => prev ? { ...prev, fotoPerfil: '' } : null);
      
      setShowPhotoModal(false);
      alert('Foto de perfil removida com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao remover foto:', error);
      alert('Erro ao remover foto de perfil. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPhotoModal = () => {
    setShowPhotoModal(false);
    setPhotoPreview(null);
    setSelectedFile(null);
    setImageUrl('');
    setShowUrlInput(false);
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
                Dashboard
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
              ) : userData?.fotoPerfil ? (
                <img 
                  src={userData.fotoPerfil} 
                  alt="Foto atual" 
                  className={styles.photoPreview}
                  onError={(e) => {
                    console.log('Erro ao carregar imagem, usando avatar padrão');
                    e.currentTarget.style.display = 'none';
                  }}
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

            {showUrlInput && (
              <div className={styles.urlInputContainer}>
                <input
                  type="url"
                  placeholder="Digite a URL da imagem..."
                  value={imageUrl}
                  onChange={handleUrlChange}
                  className={styles.urlInput}
                />
                <button 
                  className={styles.urlPreviewButton}
                  onClick={handleUrlPreview}
                  disabled={uploading || !imageUrl.trim()}
                >
                  Preview
                </button>
              </div>
            )}

            <div className={styles.photoModalButtons}>
              <button 
                className={styles.photoButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                 Escolher Arquivo
              </button>
              
              <button 
                className={styles.photoButton}
                onClick={handleUrlInput}
                disabled={uploading}
              >
                 URL da Imagem
              </button>
              
              {(selectedFile || photoPreview) && (
                <button 
                  className={`${styles.photoButton} ${styles.uploadButton}`}
                  onClick={handleSavePhoto}
                  disabled={uploading}
                >
                  {uploading ? ' Salvando...' : ' Salvar'}
                </button>
              )}
              
              {userData?.fotoPerfil && !selectedFile && !photoPreview && (
                <button 
                  className={`${styles.photoButton} ${styles.removeButton}`}
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  {uploading ? ' Removendo...' : ' Remover Foto'}
                </button>
              )}
              
              <button 
                className={`${styles.photoButton} ${styles.cancelButton}`}
                onClick={cancelPhotoModal}
                disabled={uploading}
              >
                ❌ Cancelar
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
              {userData?.fotoPerfil ? (
                <img 
                  src={userData.fotoPerfil} 
                  alt="Foto de perfil" 
                  className={styles.profileAvatarImage}
                  onError={(e) => {
                    console.log('Erro ao carregar imagem, usando avatar padrão');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Mostrar avatar padrão
                    const avatarDiv = target.nextElementSibling as HTMLElement;
                    if (avatarDiv) {
                      avatarDiv.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              
              <div 
                className={styles.profileAvatar} 
                style={{ display: userData?.fotoPerfil ? 'none' : 'flex' }}
              >
                {userData?.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              
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
                  {userData?.altura ? `Altura: ${userData.altura} cm` : 'Altura: -'}
                </span>
                <span className={styles.profileStat}>
                  {userData?.peso ? `Peso: ${userData.peso} kg` : 'Peso: -'}
                </span>
                <span className={styles.profileStat}>
                  {userData?.idade ? `Idade: ${userData.idade} anos` : 'Idade: -'}
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