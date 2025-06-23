"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from "./style.module.css";
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* Decorações de fundo */}
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundDecoration2}></div>
      
      <div className={`${styles.homePanel} ${isLoaded ? styles.panelLoaded : ''}`}>
        {/* Cabeçalho com título */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Seja bem-vindo ao
          </h1>
          
          {/* Logo */}
          <div className={styles.logoContainer}>
            <Image
              src={glicontrolLogo}
              alt="GliControl"
              className={styles.logo}
              priority
              quality={100}
              width={300}
              height={100}
            />
          </div>
        </div>

        {/* Container de botões */}
        <div className={styles.buttonContainer}>
          <button
            onClick={() => router.push('/login')}
            className={styles.primaryButton}
          >
            Entrar
          </button>
          
          <button
            onClick={() => router.push('/register')}
            className={styles.secondaryButton}
          >
            Criar conta
          </button>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className={styles.footer}>
        <p>© {new Date().getFullYear()} Glicontrol - Todos os direitos reservados</p>
      </div>
    </div>
  );
}