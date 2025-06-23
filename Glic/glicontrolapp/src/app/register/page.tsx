"use client";
import { useState, useEffect } from 'react';
import glicontrolLogo from './logo.png';
import styles from './styleRegister.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../../services/firebaseConfig';

export default function Cadastro() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    dataNascimento: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const fields = [
    { 
      label: 'Nome', 
      name: 'nome', 
      type: 'text', 
      placeholder: 'Insira seu nome',
      value: formData.nome,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, nome: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    { 
      label: 'Sobrenome', 
      name: 'sobrenome', 
      type: 'text', 
      placeholder: 'Insira seu sobrenome',
      value: formData.sobrenome,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, sobrenome: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    { 
      label: 'Data de nascimento', 
      name: 'dataNascimento', 
      type: 'date', 
      placeholder: 'dd/mm/aaaa',
      max: new Date().toISOString().split('T')[0],
      value: formData.dataNascimento,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, dataNascimento: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    { 
      label: 'E-mail', 
      name: 'email', 
      type: 'email', 
      placeholder: 'Insira seu e-mail',
      value: formData.email,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, email: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    },
    { 
      label: 'Senha', 
      name: 'password', 
      type: 'password', 
      placeholder: 'Crie uma senha',
      minLength: 6,
      value: formData.password,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setFormData({...formData, password: e.target.value}),
      icon: (
        <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        dataNascimento: formData.dataNascimento,
        email: formData.email,
        createdAt: new Date()
      });

      router.push('/login');

    } catch (error: any) {
      setError(translateFirebaseError(error.code));
    } finally {
      setLoading(false);
    }
  };

  const translateFirebaseError = (code: string) => {
    switch(code) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado';
      case 'auth/weak-password':
        return 'A senha deve ter no mínimo 6 caracteres';
      case 'auth/invalid-email':
        return 'E-mail inválido';
      default:
        return 'Erro ao cadastrar. Tente novamente.';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backButtonContainer}>
        <Link href="/" className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Voltar</span>
        </Link>
      </div>
      
      <div className={`${styles.registerPanel} ${isLoaded ? styles.panelLoaded : ''}`}>
        <div className={styles.logoContainer}>
          <Image src={glicontrolLogo} alt="GliControl" className={styles.logo} priority width={240} height={60} />
        </div>

        <h1 className={styles.pageTitle}>Crie sua conta</h1>

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
                    {...field.max && { max: field.max }}
                    {...field.minLength && { minLength: field.minLength }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.buttonsContainer}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.buttonLoader}></span>
                  <span>Criando conta...</span>
                </>
              ) : 'Criar conta'}
            </button>
          </div>
        </form>
        
        <div className={styles.loginPrompt}>
          <p>Já tem uma conta?</p>
          <Link href="/login" className={styles.loginLink}>
            Faça login
          </Link>
        </div>
      </div>
      
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>
    </div>
  );
}