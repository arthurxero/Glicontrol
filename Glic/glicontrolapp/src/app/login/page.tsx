"use client";
import { useRouter } from 'next/navigation';
import styles from './styleLogin.module.css';
import glicontrolLogo from '@/assets/glicontrol.png';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Verificação de autenticação sem redirecionamento automático
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setAuthChecked(true);
      // Apenas verifica o estado sem redirecionar
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(translateFirebaseError(error.code));
    } finally {
      setLoading(false);
    }
  };

  const translateFirebaseError = (code: string) => {
    switch(code) {
      case 'auth/invalid-email':
        return 'E-mail inválido';
      case 'auth/user-disabled':
        return 'Esta conta foi desativada';
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      default:
        return 'Erro ao fazer login. Tente novamente.';
    }
  };

  if (!authChecked) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.loginPanel} ${isLoaded ? styles.panelLoaded : ''}`}>
        {/* Logo do Glicontrol */}
        <div className={styles.logoContainer}>
          <Image
            src={glicontrolLogo}
            alt="GliControl"
            className={styles.logo}
            priority
            quality={100}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        
        <h1 className={styles.welcomeTitle}>Bem-vindo de volta!</h1>
        
        {/* Formulário de Login */}
        <form onSubmit={handleSignIn} className={styles.loginForm}>
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
          
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>E-mail</label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input 
                id="email"
                type="email" 
                placeholder="Insira seu e-mail" 
                className={styles.input} 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>Senha</label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input 
                id="password"
                type="password" 
                placeholder="Insira sua senha" 
                className={styles.input} 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.forgotPassword}>
            <Link href="/recovery1">Esqueci minha senha</Link>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.buttonLoader}></span>
                <span>Entrando...</span>
              </>
            ) : 'Entrar'}
          </button>
        </form>
        
        <div className={styles.divider}>
          <span>ou</span>
        </div>
        
        <div className={styles.signupContainer}>
          <p className={styles.signupText}>Não tem uma conta?</p>
          <button 
            className={styles.signupButton}
            onClick={() => router.push('/register')}
          >
            Cadastre-se
          </button>
        </div>
      </div>
      
      <div className={styles.backButtonContainer}>
        <Link href="/" className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Voltar</span>
        </Link>
      </div>
      
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>
    </div>
  );
};

export default Login;