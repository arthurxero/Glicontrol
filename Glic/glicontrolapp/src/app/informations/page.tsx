"use client";
import { useState, useEffect } from 'react';
import glicontrolLogo from './logo.png';
import styles from './styleRegister.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from '../../services/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function ColetaDados() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [formData, setFormData] = useState({
    altura: '',
    peso: '',
    idade: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fields = [
    { 
      label: 'Altura (cm)', 
      name: 'altura', 
      type: 'number', 
      placeholder: 'Ex: 172',
      min: 50,
      max: 300,
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
      label: 'Peso (kg)', 
      name: 'peso', 
      type: 'number', 
      placeholder: 'Ex: 80',
      min: 20,
      max: 500,
      value: formData.peso,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, peso: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18m-4-9h8M8 6l4-3 4 3M8 18l4 3 4-3" />
        </svg>
      )
    },
    { 
      label: 'Idade', 
      name: 'idade', 
      type: 'number', 
      placeholder: 'Ex: 25',
      min: 1,
      max: 120,
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
    setIsLoading(true);
    setError('');

    if (!user) {
      setError('Usuário não encontrado. Faça login novamente.');
      setIsLoading(false);
      return;
    }

    try {
      // Atualizar documento do usuário no Firestore
      await updateDoc(doc(db, "users", user.uid), {
        altura: parseInt(formData.altura),
        peso: parseInt(formData.peso),
        idade: parseInt(formData.idade),
        dadosComplementares: true,
        updatedAt: new Date()
      });

      // Redirecionar para dashboard ou página principal
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Erro ao salvar dados:', error);
      setError('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.registerPanel}>
          <div className={styles.logoContainer}>
            <Image src={glicontrolLogo} alt="GliControl" className={styles.logo} priority width={240} height={60} />
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className={styles.buttonLoader}></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButtonContainer}>
        <Link href="/dashboard" className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Pular</span>
        </Link>
      </div>
      
      <div className={`${styles.registerPanel} ${isLoaded ? styles.panelLoaded : ''}`}>
        <div className={styles.logoContainer}>
          <Image src={glicontrolLogo} alt="GliControl" className={styles.logo} priority width={240} height={60} />
        </div>

        <h1 className={styles.pageTitle}>Complete seu perfil</h1>

        <form onSubmit={handleSubmit} className={styles.registerForm}>
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
                    min={field.min}
                    max={field.max}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.buttonsContainer}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.buttonLoader}></span>
                  <span>Salvando dados...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span>Salvar e continuar</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className={styles.loginPrompt}>
          <p>Você pode pular esta etapa e completar depois</p>
          <Link href="/dashboard" className={styles.loginLink}>
            Pular por agora
          </Link>
        </div>
      </div>
      
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>
    </div>
  );
}