"use client";
import styles from './styleAbout.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);


  const router = useRouter();

    useEffect(() => {
    // Efeito para animar a entrada dos elementos
    setIsLoaded(true);
  }, []);
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

      {/* Conteúdo principal da página Sobre Nós */}
      <main className={styles.mainContent}>
        <div className={styles.aboutContainer}>
          <h1 className={styles.aboutTitle}>Sobre o Glicontrol</h1>
          
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>Nossa Missão</h2>
            <p className={styles.aboutText}>
              O Glicontrol nasceu com uma missão clara: proporcionar mais qualidade de vida e autonomia para pessoas 
              com Diabetes tipo 1, através de um sistema inteligente e intuitivo de monitoramento 
              da glicose ingerida na alimentação diária.
            </p>
          </section>
          
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>O Projeto</h2>
            <p className={styles.aboutText}>
              Nosso projeto se sustenta no desenvolvimento de um sistema de monitoramento de glicose ingerida 
              através da alimentação, visando aumentar a praticidade e acessibilidade oferecidas a um 
              público específico, os portadores da Diabetes do tipo 1.
            </p>
            <p className={styles.aboutText}>
              Criamos uma plataforma que simplifica o complexo processo de contagem de carboidratos, 
              permitindo que o usuário registre suas refeições, consulte o valor nutricional dos alimentos 
              e acompanhe seu histórico de ingestão ao longo do tempo.
            </p>
          </section>
          
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>Nossos Objetivos</h2>
            <div className={styles.objectivesGrid}>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveIcon}>🌟</div>
                <h3 className={styles.objectiveTitle}>Acessibilidade</h3>
                <p className={styles.objectiveText}>
                  Tornar o controle glicêmico acessível para todos os portadores de Diabetes tipo 1, 
                  independentemente de seu conhecimento técnico.
                </p>
              </div>
              
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveIcon}>📊</div>
                <h3 className={styles.objectiveTitle}>Precisão</h3>
                <p className={styles.objectiveText}>
                  Oferecer dados precisos sobre a quantidade de carboidratos e seu impacto na glicemia, 
                  auxiliando no controle eficaz da doença.
                </p>
              </div>
              
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveIcon}>🧠</div>
                <h3 className={styles.objectiveTitle}>Educação</h3>
                <p className={styles.objectiveText}>
                  Educar usuários sobre as relações entre alimentação e níveis de glicose, 
                  promovendo maior conhecimento e autocuidado.
                </p>
              </div>
              
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveIcon}>❤️</div>
                <h3 className={styles.objectiveTitle}>Qualidade de Vida</h3>
                <p className={styles.objectiveText}>
                  Melhorar a qualidade de vida dos usuários, reduzindo o estresse associado 
                  ao gerenciamento diário da diabetes.
                </p>
              </div>
            </div>
          </section>
          
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>Por Que Desenvolvemos o Glicontrol?</h2>
            <p className={styles.aboutText}>
              A Diabetes tipo 1 é uma condição autoimune que requer monitoramento constante dos níveis 
              de glicose no sangue. A contagem de carboidratos é uma técnica essencial para o manejo 
              eficaz da diabetes, mas pode ser trabalhosa e complicada para muitos pacientes.
            </p>
            <p className={styles.aboutText}>
              Identificamos que muitas pessoas com Diabetes tipo 1 enfrentam desafios diários para:
            </p>
            <ul className={styles.aboutList}>
              <li>Calcular com precisão a quantidade de carboidratos em suas refeições</li>
              <li>Estimar a dosagem correta de insulina necessária</li>
              <li>Manter registros consistentes de sua alimentação e níveis glicêmicos</li>
              <li>Acessar informações nutricionais confiáveis dos alimentos consumidos</li>
            </ul>
            <p className={styles.aboutText}>
              O Glicontrol nasceu para resolver esses problemas, oferecendo uma solução integrada e 
              amigável que coloca o poder do controle nas mãos do usuário.
            </p>
          </section>
          
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>Nossa Equipe</h2>
            <p className={styles.aboutText}>
              Somos uma equipe composta por estudantes do ensino médio técnico da  
              Fundação Matias Machline, com o objetivo de promover o bem estar de um grupo específico. 
              Nossa experiência combinada nos permite desenvolver soluções inovadoras que 
              realmente atendem às necessidades dos usuários.
            </p>
          </section>
          
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>Contato</h2>
            <p className={styles.aboutText}>
              Se você tem dúvidas, sugestões ou deseja saber mais sobre o projeto Glicontrol, 
              entre em contato conosco. Valorizamos seu feedback e estamos continuamente trabalhando 
              para melhorar nossa plataforma.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}