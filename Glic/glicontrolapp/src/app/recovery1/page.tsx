"use client";
import { useRouter } from 'next/navigation';
import styles from './styleRecoveryum.module.css';
import glicontrolLogo from '@/assets/glicontrol.png';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

const PasswordRecovery: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [step, setStep] = useState(1);
  const [oobCode, setOobCode] = useState('');

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Verificar se existe um código de redefinição na URL
  useEffect(() => {
    // No ambiente cliente, podemos acessar a URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('oobCode');
      
      if (code) {
        setOobCode(code);
        handleVerifyResetCode(code);
      }
    }
  }, []);

  // Função para verificar o código de redefinição
  const handleVerifyResetCode = async (code: string) => {
    setLoading(true);
    try {
      // Verifica se o código é válido
      await verifyPasswordResetCode(auth, code);
      setStep(2); // Avança para a etapa de definição de nova senha
      setError('');
    } catch (error: any) {
      setError('Código de redefinição inválido ou expirado. Por favor, solicite novamente.');
      setStep(1); // Retorna para o primeiro passo
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar o e-mail de redefinição
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/recovery`,
        handleCodeInApp: true
      });
      setSuccess(`Um e-mail de redefinição foi enviado para ${email}. Por favor, verifique sua caixa de entrada e siga as instruções.`);
    } catch (error: any) {
      setError(translateFirebaseError(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Função para redefinir a senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess('Senha redefinida com sucesso!');
      setStep(3); // Avança para a etapa de conclusão
    } catch (error: any) {
      setError(translateFirebaseError(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Função para traduzir os erros do Firebase
  const translateFirebaseError = (code: string) => {
    switch(code) {
      case 'auth/invalid-email':
        return 'E-mail inválido';
      case 'auth/user-not-found':
        return 'Não existe conta com este e-mail';
      case 'auth/expired-action-code':
        return 'O código de redefinição expirou. Por favor, solicite novamente.';
      case 'auth/invalid-action-code':
        return 'Código de redefinição inválido. Por favor, solicite novamente.';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      default:
        return 'Erro ao processar a solicitação. Tente novamente.';
    }
  };
  
  // Conteúdo baseado na etapa atual
  const renderContent = () => {
    switch(step) {
      case 1:
        return (
          <form onSubmit={handleSendResetEmail} className={styles.recoveryForm}>
            <h1 className={styles.recoveryTitle}>Recuperação de Senha</h1>
            <p className={styles.recoveryDescription}>
              Insira seu e-mail abaixo e enviaremos um link para redefinir sua senha.
            </p>
            
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{success}</span>
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
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.buttonLoader}></span>
                  <span>Enviando...</span>
                </>
              ) : 'Enviar link de recuperação'}
            </button>
          </form>
        );
      
      case 2:
        return (
          <form onSubmit={handleResetPassword} className={styles.recoveryForm}>
            <h1 className={styles.recoveryTitle}>Definir Nova Senha</h1>
            <p className={styles.recoveryDescription}>
              Crie uma nova senha para sua conta.
            </p>
            
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
              <label htmlFor="newPassword" className={styles.inputLabel}>Nova Senha</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input 
                  id="newPassword"
                  type="password" 
                  placeholder="Insira sua nova senha" 
                  className={styles.input} 
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.inputLabel}>Confirmar Senha</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input 
                  id="confirmPassword"
                  type="password" 
                  placeholder="Confirme sua nova senha" 
                  className={styles.input} 
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.buttonLoader}></span>
                  <span>Redefinindo...</span>
                </>
              ) : 'Redefinir Senha'}
            </button>
          </form>
        );
      
      case 3:
        return (
          <div className={styles.recoveryForm}>
            <div className={styles.successIconLarge}>
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            
            <h1 className={styles.recoveryTitle}>Senha Redefinida!</h1>
            <p className={styles.recoveryDescription}>
              Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
            </p>
            
            <button 
              className={styles.submitButton}
              onClick={() => router.push('/login')}
            >
              Ir para o Login
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.recoveryPanel} ${isLoaded ? styles.panelLoaded : ''}`}>
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
        
        {renderContent()}
        
        <div className={styles.divider}>
          <span>ou</span>
        </div>
        
        <div className={styles.signupContainer}>
          <p className={styles.signupText}>Lembrou sua senha?</p>
          <button 
            className={styles.signupButton}
            onClick={() => router.push('/login')}
          >
            Voltar para o Login
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

export default PasswordRecovery;