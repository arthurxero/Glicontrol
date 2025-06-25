"use client";
import { useState, useEffect } from 'react';
import glicontrolLogo from './logo.png';
import styles from './styleInfos.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from '../../services/firebaseConfig';

export default function DadosComplementares() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    idade: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Verifica se o usuário está autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkExistingData(currentUser.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Verifica se já existem dados complementares
  const checkExistingData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.perfil) {
          // Se já tem dados do perfil, redireciona para dashboard
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error("Erro ao verificar dados existentes:", error);
    }
  };

  const fields = [
    { 
      label: 'Peso (kg)', 
      name: 'peso', 
      type: 'number', 
      placeholder: 'Ex: 70',
      min: "30",
      max: "300",
      step: "0.1",
      value: formData.peso,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, peso: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
        </svg>
      )
    },
    { 
      label: 'Altura (cm)', 
      name: 'altura', 
      type: 'number', 
      placeholder: 'Ex: 170',
      min: "100",
      max: "250",
      value: formData.altura,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, altura: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    { 
      label: 'Idade', 
      name: 'idade', 
      type: 'number', 
      placeholder: 'Ex: 25',
      min: "1",
      max: "120",
      value: formData.idade,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, idade: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Busca os dados existentes do usuário
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError('Dados do usuário não encontrados');
        setLoading(false);
        return;
      }

      const existingData = userDoc.data();

      // Cria o documento do perfil
      const perfilDocRef = doc(db, "users", user.uid, "perfil", "dados");
      await setDoc(perfilDocRef, {
        peso: parseFloat(formData.peso),
        altura: parseInt(formData.altura),
        idade: parseInt(formData.idade),
        ultimaAtualizacao: new Date().toISOString()
      });

      // Atualiza o documento principal do usuário para indicar que tem perfil
      await setDoc(userDocRef, {
        ...existingData,
        perfilCompleto: true,
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      // Redireciona para o dashboard
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Erro ao salvar dados:", error);
      setError('Erro ao salvar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    return formData.peso && formData.altura && formData.idade;
  };

  return (
    <div className={styles.container}>
      <div className={styles.backButtonContainer}>
        <Link href="/dashboard" className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Voltar</span>
        </Link>
      </div>
      
      <div className={`${styles.dataPanel} ${isLoaded ? styles.panelLoaded : ''}`}>
        <div className={styles.logoContainer}>
          <Image src={glicontrolLogo} alt="GliControl" className={styles.logo} priority width={240} height={60} />
        </div>

        <h1 className={styles.pageTitle}>Complete seu perfil</h1>
        <p className={styles.pageSubtitle}>
          Precisamos de algumas informações para personalizar sua experiência
        </p>

        <form onSubmit={handleSubmit} className={styles.dataForm}>
          {error && (
            <div className={styles.errorMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className={styles.formGrid}>
            {fields.map((field) => (
              <div className={styles.inputGroup} key={field.name}>
                <label htmlFor={field.name} className={styles.inputLabel}>
                  {field.label}
                </label>
                <div className={styles.inputWrapper}>
                  {field.icon}
                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={field.onChange}
                    required
                    className={styles.input}
                    {...field.min && { min: field.min }}
                    {...field.max && { max: field.max }}
                    {...field.step && { step: field.step }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.buttonsContainer}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading || !validateForm()}
            >
              {loading ? (
                <>
                  <span className={styles.buttonLoader}></span>
                  <span>Salvando...</span>
                </>
              ) : 'Salvar dados'}
            </button>
          </div>
        </form>
        
        <div className={styles.infoBox}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>Esses dados nos ajudam a calcular suas necessidades de insulina e acompanhar seu progresso de forma personalizada.</p>
        </div>
      </div>
      
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>
    </div>
  );
}