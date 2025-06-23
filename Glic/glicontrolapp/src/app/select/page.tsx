"use client";
import styles from './styleSelect.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefeicaoSelecionada() {
  const [menuOpen, setMenuOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
      // Efeito para animar a entrada dos elementos
      setIsLoaded(true);
    }, []);
  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    window.location.href = '/';
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  const handleRefeicaoClick = () => {
    router.push('/search'); // Alterado para redirecionar para /search
  };

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
                Página Inicial
              </Link>
            </li>
            <li className={styles.sidebarItem}>
              <Link href="/account" className={styles.sidebarLink}>
                Minha conta
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

      {/* Main content - Ajustado com margem superior */}
      <main className={styles.mainContent}>
        <div className={styles.mealContainer}>
          <button 
            className={styles.mealButton}
            onClick={handleRefeicaoClick} // Todos os botões usam a mesma função
          >
            Café da manhã
          </button>
          
          <button 
            className={styles.mealButton}
            onClick={handleRefeicaoClick}
          >
            Almoço
          </button>
          
          <button 
            className={styles.mealButton}
            onClick={handleRefeicaoClick}
          >
            Janta
          </button>
          
          <button 
            className={styles.mealButton}
            onClick={handleRefeicaoClick}
          >
            Outros
          </button>
        </div>
      </main>
    </div>
  );
}