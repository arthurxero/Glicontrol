"use client";
import { useState, useEffect } from 'react';
import glicontrolLogo from './logo.png';
import styles from './styleInformations.module.css';
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
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const validateForm = () => {
    const { altura, peso, idade } = formData;
    
    if (!altura || !peso || !idade) {
      setError('Todos os campos são obrigatórios');
      return false;
    }

    const alturaNum = parseFloat(altura);
    const pesoNum = parseFloat(peso);
    const idadeNum = parseInt(idade);

    if (alturaNum < 50 || alturaNum > 300) {
      setError('Altura deve estar entre 50 e 300 cm');
      return false;
    }

    if (pesoNum < 20 || pesoNum > 500) {
      setError('Peso deve estar entre 20 e 500 kg');
      return false;
    }

    if (idadeNum < 1 || idadeNum > 120) {
      setError('Idade deve estar entre 1 e 120 anos');
      return false;
    }

    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar mensagens de erro/sucesso quando o usuário digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!user) {
      setError('Usuário não encontrado. Faça login novamente.');
      setIsLoading(false);
      return;
    }

    try {
      // Preparar dados para atualização
      const updateData = {
        altura: parseFloat(formData.altura),
        peso: parseFloat(formData.peso),
        idade: parseInt(formData.idade),
        dadosComplementares: true,
        updatedAt: new Date()
      };

      // Atualizar documento do usuário no Firestore
      await updateDoc(doc(db, "users", user.uid), updateData);

      setSuccess('Dados salvos com sucesso!');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao salvar dados:', error);
      setError('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { 
      label: 'Altura (cm)', 
      name: 'altura', 
      type: 'number', 
      placeholder: 'Ex: 172',
      min: 50,
      max: 300,
      step: 0.1,
      value: formData.altura,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleInputChange('altura', e.target.value),
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
      step: 0.1,
      value: formData.peso,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleInputChange('peso', e.target.value),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="9" y2="15"/>
          <line x1="15" y1="9" x2="15" y2="15"/>
        </svg>
      )
    },
    { 
      label: 'Idade (anos)', 
      name: 'idade', 
      type: 'number', 
      placeholder: 'Ex: 25',
      min: 1,
      max: 120,
      value: formData.idade,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleInputChange('idade', e.target.value),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      )
    }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.informationPanel}>
          <div className={styles.logoContainer}>
            <Image src={glicontrolLogo} alt="GliControl" className={styles.logo} priority width={240} height={60} />
          </div>
          <div className={styles.loadingContainer}>
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
          <span>Voltar</span>
        </Link>
      </div>
      
      <div className={`${styles.informationPanel} ${isLoaded ? styles.panelLoaded : ''}`}>
        <div className={styles.logoContainer}>
          <Image src={glicontrolLogo} alt="GliControl" className={styles.logo} priority width={240} height={60} />
        </div>

        <h1 className={styles.pageTitle}>Complete seus dados</h1>
        <p className={styles.pageSubtitle}>
          Essas informações nos ajudam a personalizar sua experiência
        </p>

        <form onSubmit={handleSubmit} className={styles.informationForm}>
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

          {success && (
            <div className={styles.successMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <span>{success}</span>
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
                    step={field.step}
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
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                  <span>Salvar Dados</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className={styles.skipPrompt}>
          <p>Você pode pular esta etapa e completar depois</p>
          <Link href="/dashboard" className={styles.skipLink}>
            Pular por agora
          </Link>
        </div>
      </div>
      
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>
    </div>
  );
}