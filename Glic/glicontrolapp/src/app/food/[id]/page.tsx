"use client";
import styles from './styleFood.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';

// Interfaces
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
  lipideos: number;
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

interface NutrientCalculation {
  carboidratos: number;
  proteinas: number;
  lipideos: number;
  calorias: number;
  fibra_alimentar: number;
  sodio: number;
  colesterol: number;
  potassio: number;
}

export default function FoodDetails() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(100);
  const [calculatedNutrients, setCalculatedNutrients] = useState<NutrientCalculation | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<'grams' | 'portions'>('grams');
  
  const router = useRouter();
  const [foodId, setFoodId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Wait for complete hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Multiple ways to get the ID
    const getId = () => {
      // Method 1: Current URL
      const currentUrl = window.location.href;
      const urlParts = currentUrl.split('/');
      let id = urlParts[urlParts.length - 1];
      
      // Remove query parameters and fragments
      id = id.split('?')[0].split('#')[0];
      
      // Method 2: If it doesn't work, try by pathname
      if (!id || id === 'food') {
        const pathname = window.location.pathname;
        const pathParts = pathname.split('/');
        id = pathParts[pathParts.length - 1];
      }
      
      // Method 3: If it still doesn't work, search by pattern
      if (!id || id === 'food') {
        const match = currentUrl.match(/\/food\/([^\/\?#]+)/);
        if (match) {
          id = match[1];
        }
      }
      
      return id;
    };

    const id = getId();
    console.log('Extracted ID:', id);
    console.log('Current URL:', window.location.href);
    
    if (id && id !== 'food' && id !== foodId) {
      setFoodId(decodeURIComponent(id));
    }
  }, [mounted, foodId]);

  // Helper functions
  const extractFoodName = (data: any): string => {
    const possibleNames = [
      data['Descrição dos alimentos'],
      data['descricao'],
      data['Descricao dos alimentos'],
      data['descricao_dos_alimentos'],
      data['Descrição'],
      data.descricao,
      data.nome,
      data.name
    ];
    
    return possibleNames.find(name => name && typeof name === 'string' && name.trim() !== '') || "Alimento sem nome";
  };

  const extractNutrientValue = (data: any, nutrientKeys: string[]): number => {
    for (const key of nutrientKeys) {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = parseFloat(value.toString().replace(',', '.'));
        if (!isNaN(numValue)) {
          return numValue;
        }
      }
    }
    return 0;
  };

  const documentToFood = (doc: any): Food => {
    const data = doc.data();
    const nome = extractFoodName(data);
    
    return {
      id: doc.id,
      nome,
      categoria: data.categoria || "Alimento",
      carboidratos: extractNutrientValue(data, [
        'Carboidrato (g)', 'carboidrato', 'carboidrato_g', 'Carboidrato'
      ]),
      proteinas: extractNutrientValue(data, [
        'Proteína (g)', 'proteina', 'proteina_g', 'Proteína', 'Proteina'
      ]),
      lipideos: extractNutrientValue(data, [
        'Lipídeos (g)', 'lipideos', 'lipideos_g', 'Lipídeos', 'Lipideos'
      ]),
      calorias: extractNutrientValue(data, [
        'Energia (kcal)', 'energia_kcal', 'calorias', 'Energia'
      ]),
      energia_kj: extractNutrientValue(data, [
        'Energia (kJ)', 'energia_kj'
      ]),
      energia_kcal: extractNutrientValue(data, [
        'Energia (kcal)', 'energia_kcal'
      ]),
      fibra_alimentar: extractNutrientValue(data, [
        'Fibra Alimentar (g)', 'fibra_alimentar', 'fibra'
      ]),
      sodio: extractNutrientValue(data, [
        'Sódio (mg)', 'sodio', 'Sódio', 'Sodio'
      ]),
      colesterol: extractNutrientValue(data, [
        'Colesterol (mg)', 'colesterol', 'Colesterol'
      ]),
      potassio: extractNutrientValue(data, [
        'Potássio (mg)', 'potassio', 'Potássio', 'Potassio'
      ]),
      cobre: extractNutrientValue(data, [
        'Cobre (mg)', 'cobre', 'Cobre'
      ]),
      zinco: extractNutrientValue(data, [
        'Zinco (mg)', 'zinco', 'Zinco'
      ]),
      numero_alimento: extractNutrientValue(data, [
        'Número do Alimento', 'numero_alimento', 'numero'
      ]),
      descricao: nome,
      indiceGlicemico: extractNutrientValue(data, [
        'indice_glicemico', 'ig', 'indiceGlicemico'
      ]) || undefined,
      porcao: extractNutrientValue(data, [
        'porcao', 'porcao_g', 'porcao_comum'
      ]) || 100,
      unidadePorcao: data.unidade_porcao || data.unidadePorcao || 'g'
    };
  };

  // Load food details
  const loadFoodDetails = useCallback(async () => {
    if (!foodId) {
      console.error('Food ID not found in URL');
      router.push('/search');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Loading data for ID:', foodId);
      
      const foodDoc = doc(db, 'tabela_taco', foodId);
      const foodSnapshot = await getDoc(foodDoc);
      
      if (foodSnapshot.exists()) {
        const foodData = documentToFood(foodSnapshot);
        console.log('Food data loaded:', foodData);
        setFood(foodData);
      } else {
        console.error('Food not found in Firestore');
        // Try searching with URL decoding
        const decodedId = decodeURIComponent(foodId);
        if (decodedId !== foodId) {
          console.log('Trying with decoded ID:', decodedId);
          const decodedFoodDoc = doc(db, 'tabela_taco', decodedId);
          const decodedFoodSnapshot = await getDoc(decodedFoodDoc);
          
          if (decodedFoodSnapshot.exists()) {
            const foodData = documentToFood(decodedFoodSnapshot);
            setFood(foodData);
            return;
          }
        }
        
        alert('Alimento não encontrado');
        router.push('/search');
      }
    } catch (error) {
      console.error("Error loading food details:", error);
      alert('Erro ao carregar dados do alimento');
      router.push('/search');
    } finally {
      setIsLoading(false);
    }
  }, [foodId, router]);

  // Calculate nutrients
  const calculateNutrients = useCallback(() => {
    if (!food) return;

    let baseQuantity = 100;
    let actualQuantity = selectedQuantity;

    if (selectedUnit === 'portions' && food.porcao) {
      actualQuantity = selectedQuantity * food.porcao;
    }

    const multiplier = actualQuantity / baseQuantity;

    const calculated: NutrientCalculation = {
      carboidratos: food.carboidratos * multiplier,
      proteinas: food.proteinas * multiplier,
      lipideos: food.lipideos * multiplier,
      calorias: food.calorias * multiplier,
      fibra_alimentar: (food.fibra_alimentar || 0) * multiplier,
      sodio: (food.sodio || 0) * multiplier,
      colesterol: (food.colesterol || 0) * multiplier,
      potassio: (food.potassio || 0) * multiplier
    };

    setCalculatedNutrients(calculated);
  }, [food, selectedQuantity, selectedUnit]);

  // Effects
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (foodId) {
      loadFoodDetails();
    }
  }, [foodId, loadFoodDetails]);

  useEffect(() => {
    calculateNutrients();
  }, [calculateNutrients]);

  // Event handlers
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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setSelectedQuantity(value);
    }
  };

  const handleUnitChange = (unit: 'grams' | 'portions') => {
    setSelectedUnit(unit);
    if (unit === 'portions') {
      setSelectedQuantity(1);
    } else {
      setSelectedQuantity(100);
    }
  };

  const formatNutrient = (value: number, unit: string = 'g'): string => {
    if (value === 0) return `0${unit}`;
    return `${value.toFixed(1)}${unit}`;
  };

  const formatCalories = (value: number): string => {
    if (value === 0) return '0 kcal';
    return `${value.toFixed(0)} kcal`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.menuToggle} onClick={toggleMenu}>
            ☰
          </button>
          <div className={styles.logoContainer}>
            <Image src={glicontrolLogo} alt="GliControl Logo" className={styles.logo} priority />
          </div>
        </header>
        
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Carregando informações do alimento...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (!food) {
    return (
      <div className={styles.container}>
        <main className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <p>Alimento não encontrado</p>
            <Link href="/search" className={styles.backButton}>
              Voltar para pesquisa
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Main render
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
              <Link href="/search" className={styles.sidebarLink}>
                Pesquisar Alimentos
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

      <main className={`${styles.mainContent} ${isLoaded ? styles.contentLoaded : ''}`}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/search" className={styles.breadcrumbLink}>
            ← Voltar para pesquisa
          </Link>
        </div>

        {/* Food Header */}
        <div className={styles.foodHeader}>
          <h1 className={styles.foodTitle}>{food.nome}</h1>
          <div className={styles.foodCategory}>{food.categoria}</div>
          {food.indiceGlicemico && food.indiceGlicemico > 0 && (
            <div className={styles.igContainer}>
              <span className={`${styles.igBadge} ${
                food.indiceGlicemico < 55 ? styles.igLow : 
                food.indiceGlicemico < 70 ? styles.igMedium : 
                styles.igHigh
              }`}>
                Índice Glicêmico: {food.indiceGlicemico}
                <span className={styles.igLevel}>
                  {food.indiceGlicemico < 55 ? ' (Baixo)' : 
                   food.indiceGlicemico < 70 ? ' (Médio)' : 
                   ' (Alto)'}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        <div className={styles.quantitySection}>
          <h2 className={styles.sectionTitle}>Selecionar Quantidade</h2>
          
          <div className={styles.unitSelector}>
            <button 
              className={`${styles.unitButton} ${selectedUnit === 'grams' ? styles.unitActive : ''}`}
              onClick={() => handleUnitChange('grams')}
            >
              Gramas (g)
            </button>
            <button 
              className={`${styles.unitButton} ${selectedUnit === 'portions' ? styles.unitActive : ''}`}
              onClick={() => handleUnitChange('portions')}
            >
              Porções
            </button>
          </div>

          <div className={styles.quantityInput}>
            <label htmlFor="quantity" className={styles.quantityLabel}>
              {selectedUnit === 'grams' ? 'Quantidade (g):' : 'Número de porções:'}
            </label>
            <input
              id="quantity"
              type="number"
              value={selectedQuantity}
              onChange={handleQuantityChange}
              min="0.1"
              step="0.1"
              className={styles.quantityField}
            />
            {selectedUnit === 'portions' && food.porcao && (
              <div className={styles.portionInfo}>
                1 porção = {food.porcao}g
              </div>
            )}
          </div>
        </div>

        {/* Macronutrients Display */}
        {calculatedNutrients && (
          <div className={styles.nutrientsSection}>
            <h2 className={styles.sectionTitle}>
              Informações Nutricionais 
              <span className={styles.quantityDisplay}>
                ({selectedUnit === 'grams' ? 
                  `${selectedQuantity}g` : 
                  `${selectedQuantity} porção${selectedQuantity !== 1 ? 'ões' : ''}`
                })
              </span>
            </h2>

            {/* Macronutrients Cards */}
            <div className={styles.macroCards}>
              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>🔥</div>
                <div className={styles.macroLabel}>Calorias</div>
                <div className={styles.macroValue}>{formatCalories(calculatedNutrients.calorias)}</div>
              </div>

              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>🍞</div>
                <div className={styles.macroLabel}>Carboidratos</div>
                <div className={styles.macroValue}>{formatNutrient(calculatedNutrients.carboidratos)}</div>
              </div>

              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>🥩</div>
                <div className={styles.macroLabel}>Proteínas</div>
                <div className={styles.macroValue}>{formatNutrient(calculatedNutrients.proteinas)}</div>
              </div>

              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>🥑</div>
                <div className={styles.macroLabel}>Lipídeos</div>
                <div className={styles.macroValue}>{formatNutrient(calculatedNutrients.lipideos)}</div>
              </div>
            </div>

            {/* Additional Nutrients */}
            <div className={styles.additionalNutrients}>
              <h3 className={styles.additionalTitle}>Outros Nutrientes</h3>
              <div className={styles.nutrientsList}>
                <div className={styles.nutrientItem}>
                  <span className={styles.nutrientName}>Fibra Alimentar:</span>
                  <span className={styles.nutrientValue}>{formatNutrient(calculatedNutrients.fibra_alimentar)}</span>
                </div>
                <div className={styles.nutrientItem}>
                  <span className={styles.nutrientName}>Sódio:</span>
                  <span className={styles.nutrientValue}>{formatNutrient(calculatedNutrients.sodio, 'mg')}</span>
                </div>
                <div className={styles.nutrientItem}>
                  <span className={styles.nutrientName}>Colesterol:</span>
                  <span className={styles.nutrientValue}>{formatNutrient(calculatedNutrients.colesterol, 'mg')}</span>
                </div>
                <div className={styles.nutrientItem}>
                  <span className={styles.nutrientName}>Potássio:</span>
                  <span className={styles.nutrientValue}>{formatNutrient(calculatedNutrients.potassio, 'mg')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className={styles.infoFooter}>
          <p className={styles.infoText}>
            <strong>Fonte:</strong> Tabela Brasileira de Composição de Alimentos (TACO) - UNICAMP
          </p>
          <p className={styles.infoText}>
            Os valores nutricionais são baseados em 100g do alimento e podem variar conforme 
            a forma de preparo e origem do produto.
          </p>
        </div>
      </main>
    </div>
  );
}