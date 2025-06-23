'use client';
import styles from './styleFood.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { database } from '../../services/firebaseConfig';
interface Food {
  id: string;
  nome: string;
  categoria?: string;
  carboidratos: number;
  proteinas: number;
  calorias: number;
  descricao?: string;
  energia_kj?: number;
  energia_kcal?: number;
  fibra_alimentar?: number;
  lipideos?: number;
  numero_alimento?: number;
  sodio?: number;
  colesterol?: number;
  umidade?: number;
  cinzas?: number;
  potassio?: number;
  cobre?: number;
  zinco?: number;
  indiceGlicemico?: number;
  porcao?: number;
  unidadePorcao?: string;
}

export default function FoodDetails() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portion, setPortion] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [foodId, setFoodId] = useState<string>('');
  
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Extrai o ID da URL de forma mais confiável
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id || id === 'food') {
      setError('ID do alimento não encontrado na URL');
      return;
    }
    
    setFoodId(id);
  }, []);

  useEffect(() => {
    const fetchFood = async () => {
      if (!foodId) return;

      try {
        setIsLoading(true);
        const foodRef = doc(db, 'tabela_taco', foodId);
        const foodSnap = await getDoc(foodRef);
        
        if (foodSnap.exists()) {
          const data = foodSnap.data();
          const descricao = 
            data['Descrição dos alimentos'] || 
            data['descricao'] || 
            data['Descricao dos alimentos'] ||
            data['descricao_dos_alimentos'] ||
            data['Descrição'] ||
            data.descricao ||
            "Alimento sem nome";
            
          const foodData: Food = {
            id: foodSnap.id,
            nome: descricao,
            categoria: "Alimento",
            carboidratos: parseFloat(data['Carboidrato (g)'] || data['carboidrato'] || data.carboidrato || data.carboidrato_g || 0),
            proteinas: parseFloat(data['Proteína (g)'] || data['proteina'] || data.proteina || data.proteina_g || 0),
            lipideos: parseFloat(data['Lipídeos (g)'] || data['lipideos'] || data.lipideos || data.lipideos_g || 0),
            calorias: parseFloat(data['Energia (kcal)'] || data['energia_kcal'] || data.energia_kcal || 0),
            energia_kj: parseFloat(data['Energia (kJ)'] || data['energia_kj'] || data.energia_kj || 0),
            energia_kcal: parseFloat(data['Energia (kcal)'] || data['energia_kcal'] || data.energia_kcal || 0),
            fibra_alimentar: parseFloat(data['Fibra Alimentar (g)'] || data['fibra_alimentar'] || data.fibra_alimentar || 0),
            sodio: parseFloat(data['Sódio (mg)'] || data['sodio'] || data.sodio || 0),
            colesterol: parseFloat(data['Colesterol (mg)'] || data['colesterol'] || data.colesterol || 0),
            umidade: parseFloat(data['Umidade (g)'] || data['umidade'] || data.umidade || 0),
            cinzas: parseFloat(data['Cinzas (g)'] || data['cinzas'] || data.cinzas || 0),
            potassio: parseFloat(data['Potássio (mg)'] || data['potassio'] || data.potassio || 0),
            cobre: parseFloat(data['Cobre (mg)'] || data['cobre'] || data.cobre || 0),
            zinco: parseFloat(data['Zinco (mg)'] || data['zinco'] || data.zinco || 0),
            numero_alimento: parseFloat(data['Número do Alimento'] || data['numero_alimento'] || data.numero_alimento || 0),
            descricao: descricao,
            indiceGlicemico: data.indiceGlicemico || undefined,
            porcao: data.porcao || 100,
            unidadePorcao: data.unidadePorcao || 'g'
          };
          
          setFood(foodData);
        } else {
          setError('Alimento não encontrado no banco de dados');
        }
      } catch (error) {
        console.error("Erro ao carregar alimento:", error);
        setError('Erro ao carregar dados do alimento');
      } finally {
        setIsLoading(false);
      }
    };

    if (foodId) {
      fetchFood();
    }
  }, [foodId]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleExitClick = () => setShowExitModal(true);
  const confirmExit = () => { window.location.href = '/'; };
  const cancelExit = () => setShowExitModal(false);
  
  const handlePortionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPortion(parseFloat(e.target.value) || 0);
  };

  const handleGoBack = () => router.push('/pesquisa');

  const calculateNutrient = (value: number | undefined, basePortion = 100) => {
    return value ? (value * portion) / basePortion : 0;
  };

  const formatNutrient = (value: number, unit = 'g', decimals = 1) => {
    return value === 0 ? '-' : `${value.toFixed(decimals)}${unit}`;
  };

  const getIGCategory = (ig: number) => {
    if (ig < 55) return { text: 'Baixo', class: styles.igLow };
    if (ig < 70) return { text: 'Médio', class: styles.igMedium };
    return { text: 'Alto', class: styles.igHigh };
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Carregando informações do alimento...</p>
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Oops! Algo deu errado</h2>
          <p className={styles.errorText}>{error || 'Alimento não encontrado'}</p>
          <button className={styles.backButton} onClick={handleGoBack}>
            ← Voltar à Pesquisa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.menuToggle} onClick={toggleMenu} aria-label="Menu de navegação">
          ☰
        </button>
        <div className={`${styles.logoContainer} ${isLoaded ? styles.logoLoaded : ''}`}>
          <Image src={glicontrolLogo} alt="GliControl Logo" className={styles.logo} priority />
        </div>
      </header>

      <div className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <nav className={styles.sidebarNav}>
          <ul className={styles.sidebarMenu}>
            <li className={styles.sidebarItem}>
              <Link href="/dashboard" className={styles.sidebarLink}>Página Inicial</Link>
            </li>
            <li className={styles.sidebarItem}>
              <Link href="/pesquisa" className={styles.sidebarLink}>Pesquisar Alimentos</Link>
            </li>
            <li className={styles.sidebarItem}>
              <Link href="/account" className={styles.sidebarLink}>Minha conta</Link>
            </li>
            <li className={styles.sidebarItem}>
              <Link href="/about" className={styles.sidebarLink}>Sobre</Link>
            </li>
            <li className={styles.sidebarItem}>
              <button className={styles.sidebarButton} onClick={handleExitClick}>Sair</button>
            </li>
          </ul>
        </nav>
      </div>

      {menuOpen && <div className={styles.backdrop} onClick={toggleMenu} aria-hidden="true" />}

      {showExitModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.fadeIn}`}>
            <p className={styles.modalText}>Deseja realmente sair?</p>
            <div className={styles.modalButtons}>
              <button className={`${styles.modalButton} ${styles.confirmButton}`} onClick={confirmExit}>Sim</button>
              <button className={`${styles.modalButton} ${styles.cancelButton}`} onClick={cancelExit}>Não</button>
            </div>
          </div>
        </div>
      )}

      <main className={`${styles.mainContent} ${isLoaded ? styles.contentLoaded : ''}`}>
        <div className={styles.backButtonContainer}>
          <button className={styles.backButton} onClick={handleGoBack}>← Voltar à Pesquisa</button>
        </div>

        <div className={styles.foodHeader}>
          <h1 className={styles.foodName}>{food.nome}</h1>
          <p className={styles.foodCategory}>{food.categoria || 'Alimento'}</p>
          {food.numero_alimento && <p className={styles.foodNumber}>Código TACO: {food.numero_alimento}</p>}
        </div>

        <div className={styles.portionContainer}>
          <label className={styles.portionLabel}>
            Calcular para quantidade:
            <div className={styles.portionInputWrapper}>
              <input
                type="number"
                value={portion}
                onChange={handlePortionChange}
                className={styles.portionInput}
                min="1"
                step="1"
              />
              <span className={styles.portionUnit}>g</span>
            </div>
          </label>
          <p className={styles.portionNote}>
            * Valores nutricionais da Tabela TACO são baseados em 100g do alimento
          </p>
        </div>

        <div className={styles.nutritionGrid}>
          <div className={styles.nutritionCard}>
            <h3 className={styles.cardTitle}>Macronutrientes</h3>
            <div className={styles.nutritionList}>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Energia (kcal)</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.calorias), '', 0)}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Energia (kJ)</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.energia_kj), ' kJ', 0)}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Carboidratos</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.carboidratos))}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Proteínas</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.proteinas))}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Lipídeos</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.lipideos))}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Fibra Alimentar</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.fibra_alimentar))}</span>
              </div>
            </div>
          </div>

          <div className={styles.nutritionCard}>
            <h3 className={styles.cardTitle}>Minerais</h3>
            <div className={styles.nutritionList}>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Sódio</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.sodio), 'mg', 1)}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Potássio</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.potassio), 'mg', 1)}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Cobre</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.cobre), 'mg', 2)}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Zinco</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.zinco), 'mg', 2)}</span>
              </div>
            </div>
          </div>

          <div className={styles.nutritionCard}>
            <h3 className={styles.cardTitle}>Composição</h3>
            <div className={styles.nutritionList}>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Umidade</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.umidade))}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Cinzas</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.cinzas))}</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutrientName}>Colesterol</span>
                <span className={styles.nutrientValue}>{formatNutrient(calculateNutrient(food.colesterol), 'mg', 1)}</span>
              </div>
            </div>
          </div>

          {food.indiceGlicemico && (
            <div className={styles.nutritionCard}>
              <h3 className={styles.cardTitle}>Índice Glicêmico</h3>
              <div className={styles.igContainer}>
                <div className={styles.igValue}>
                  <span className={styles.igNumber}>{food.indiceGlicemico}</span>
                  <span className={`${styles.igCategory} ${getIGCategory(food.indiceGlicemico).class}`}>
                    {getIGCategory(food.indiceGlicemico).text}
                  </span>
                </div>
                <div className={styles.igExplanation}>
                  <p>
                    {food.indiceGlicemico < 55 
                      ? 'Alimento com baixo impacto na glicemia. Ideal para controle glicêmico.'
                      : food.indiceGlicemico < 70 
                      ? 'Alimento com impacto moderado na glicemia. Consumir com moderação.'
                      : 'Alimento com alto impacto na glicemia. Consumir com cautela.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>Sobre a Tabela TACO</h3>
          <p className={styles.infoText}>
            A Tabela TACO (Tabela Brasileira de Composição de Alimentos) foi desenvolvida pelo Núcleo 
            de Estudos e Pesquisas em Alimentação (NEPA) da UNICAMP. Os valores apresentados referem-se
            à composição nutricional de alimentos in natura, sem preparo ou processamento adicional.
          </p>
          <div className={styles.disclaimerBox}>
            <p className={styles.disclaimerText}>
              <strong>Importante:</strong> As informações nutricionais são baseadas em dados científicos
              da Tabela TACO e devem ser usadas apenas como referência. Para orientações específicas sobre
              dieta e controle glicêmico, consulte sempre um profissional de saúde qualificado.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}