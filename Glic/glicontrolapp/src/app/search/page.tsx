"use client";
import styles from './styleSearch.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

// Interface para os alimentos da tabela TACO
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

const ITEMS_PER_PAGE = 50;

export default function Pesquisa() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [displayedFoods, setDisplayedFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  // Função para normalizar e extrair nome do alimento
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

  // Função para extrair dados nutricionais com múltiplas tentativas
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

  // Função para converter documento Firestore em objeto Food
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
      numero_alimento: extractNutrientValue(data, [
        'Número do Alimento', 'numero_alimento', 'numero'
      ]),
      descricao: nome,
      indiceGlicemico: extractNutrientValue(data, [
        'indice_glicemico', 'ig', 'indiceGlicemico'
      ]) || undefined
    };
  };

  // Função para carregar todos os alimentos (paginado)
  const loadAllFoods = useCallback(async (isInitial = false) => {
    if (!isInitial && !hasMore) return;
    
    try {
      setIsLoading(true);
      const foodsRef = collection(db, 'tabela_taco');
      
      let q;
      if (isInitial || !lastDoc) {
        // Primeira carga - buscar por número do alimento se disponível para ordenação consistente
        q = query(foodsRef, limit(ITEMS_PER_PAGE * 3)); // Carregamos mais na primeira vez
      } else {
        q = query(foodsRef, startAfter(lastDoc), limit(ITEMS_PER_PAGE));
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        return;
      }
      
      const newFoods: Food[] = [];
      querySnapshot.forEach((doc) => {
        const food = documentToFood(doc);
        // Filtrar alimentos com nome válido
        if (food.nome && food.nome !== "Alimento sem nome") {
          newFoods.push(food);
        }
      });
      
      if (isInitial) {
        setAllFoods(newFoods);
        setFilteredFoods(newFoods);
        setDisplayedFoods(newFoods.slice(0, ITEMS_PER_PAGE));
        setTotalCount(newFoods.length);
      } else {
        setAllFoods(prev => {
          const combined = [...prev, ...newFoods];
          // Remover duplicatas baseado no ID
          const unique = combined.filter((food, index, self) => 
            index === self.findIndex(f => f.id === food.id)
          );
          return unique;
        });
      }
      
      // Atualizar último documento para paginação
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      
      // Se retornou menos documentos que o limite, não há mais para carregar
      if (querySnapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
      
      console.log(`Carregados ${newFoods.length} alimentos. Total: ${allFoods.length + newFoods.length}`);
      
    } catch (error) {
      console.error("Erro ao carregar alimentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, lastDoc, allFoods.length]);

  // Carregar alimentos na inicialização
  useEffect(() => {
    setIsLoaded(true);
    loadAllFoods(true);
  }, []);

  // Filtrar alimentos baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFoods(allFoods);
      setDisplayedFoods(allFoods.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(0);
      return;
    }

    setIsSearching(true);
    
    // Debounce para pesquisa
    const timer = setTimeout(() => {
      const filtered = allFoods.filter(food => 
        food.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (food.categoria && food.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setFilteredFoods(filtered);
      setDisplayedFoods(filtered.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(0);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm, allFoods]);

  // Função para carregar mais resultados
  const loadMoreResults = () => {
    const nextPage = currentPage + 1;
    const startIndex = nextPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    const newItems = filteredFoods.slice(startIndex, endIndex);
    setDisplayedFoods(prev => [...prev, ...newItems]);
    setCurrentPage(nextPage);
  };

  // Função para carregar mais alimentos do Firestore
  const loadMoreFromFirestore = () => {
    if (!isLoading && hasMore) {
      loadAllFoods(false);
    }
  };

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFoodSelect = (food: Food) => {
    router.push(`/food/${food.id}`);
  };

  // Função para exibir macronutrientes formatados
  const formatNutrient = (value: number | undefined): string => {
    if (value === undefined || value === null || value === 0) return '-';
    return value.toFixed(1) + 'g';
  };
  
  // Função para exibir calorias formatadas
  const formatCalories = (value: number | undefined): string => {
    if (value === undefined || value === null || value === 0) return '-';
    return value.toFixed(0);
  };

  const hasMoreToShow = displayedFoods.length < filteredFoods.length;
  const showLoadMoreFirestore = !searchTerm && hasMore && displayedFoods.length >= allFoods.length * 0.8;

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

      <main className={`${styles.mainContent} ${isLoaded ? styles.contentLoaded : ''}`}>
        <h1 className={styles.sectionTitle}>Pesquisa de Alimentos</h1>
        
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Digite o nome do alimento..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <svg 
              className={styles.searchIcon} 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          {/* Contador de resultados */}
          {!isLoading && (
            <div className={styles.resultsCounter}>
              <p>
                {searchTerm ? (
                  `${filteredFoods.length} alimentos encontrados para "${searchTerm}"`
                ) : (
                  `${allFoods.length} alimentos carregados da Tabela TACO${hasMore ? ' (carregando mais...)' : ''}`
                )}
              </p>
            </div>
          )}
          
          {isSearching && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Buscando alimentos...</p>
            </div>
          )}

          {!isSearching && searchTerm && filteredFoods.length === 0 && !isLoading && (
            <div className={styles.noResults}>
              <p>Nenhum alimento encontrado para "{searchTerm}"</p>
              <span className={styles.sadFace}>😕</span>
              <p className={styles.searchSuggestion}>
                Tente termos mais simples como "arroz", "feijão", "carne"
              </p>
            </div>
          )}

          {!isSearching && displayedFoods.length > 0 && (
            <div className={styles.resultsContainer}>
              <h2 className={styles.resultsTitle}>
                {searchTerm ? 'Resultados da pesquisa' : 'Todos os alimentos'}
              </h2>
              <ul className={styles.resultsList}>
                {displayedFoods.map((food: Food) => (
                  <li 
                    key={food.id} 
                    className={styles.resultItem}
                    onClick={() => handleFoodSelect(food)}
                  >
                    <div className={styles.foodName}>{food.nome}</div>
                    <div className={styles.foodCategory}>{food.categoria || 'Alimento'}</div>
                    <div className={styles.foodInfo}>
                      <span className={styles.nutrientTag}>
                        <span className={styles.nutrientLabel}>Carb:</span> 
                        <span className={styles.nutrientValue}>{formatNutrient(food.carboidratos)}</span>
                      </span>
                      <span className={styles.nutrientTag}>
                        <span className={styles.nutrientLabel}>Prot:</span> 
                        <span className={styles.nutrientValue}>{formatNutrient(food.proteinas)}</span>
                      </span>
                      <span className={styles.nutrientTag}>
                        <span className={styles.nutrientLabel}>Lip:</span> 
                        <span className={styles.nutrientValue}>{formatNutrient(food.lipideos)}</span>
                      </span>
                      <span className={styles.nutrientTag}>
                        <span className={styles.nutrientLabel}>Cal:</span> 
                        <span className={styles.nutrientValue}>{formatCalories(food.calorias)}</span>
                      </span>
                    </div>
                    {food.indiceGlicemico && food.indiceGlicemico > 0 && (
                      <div className={styles.igInfo}>
                        <span className={`${styles.igBadge} ${
                          food.indiceGlicemico < 55 ? styles.igLow : 
                          food.indiceGlicemico < 70 ? styles.igMedium : 
                          styles.igHigh
                        }`}>
                          IG: {food.indiceGlicemico}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Botão para carregar mais resultados */}
              {hasMoreToShow && (
                <div className={styles.loadMoreContainer}>
                  <button 
                    className={styles.loadMoreButton}
                    onClick={loadMoreResults}
                  >
                    Carregar mais resultados ({displayedFoods.length} de {filteredFoods.length})
                  </button>
                </div>
              )}

              {/* Botão para carregar mais do Firestore */}
              {showLoadMoreFirestore && (
                <div className={styles.loadMoreContainer}>
                  <button 
                    className={styles.loadMoreButton}
                    onClick={loadMoreFromFirestore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Carregando...' : 'Carregar mais alimentos do banco'}
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading && displayedFoods.length === 0 && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Carregando tabela TACO...</p>
            </div>
          )}

          <div className={styles.searchTips}>
            <h3 className={styles.tipsTitle}>Sobre a Tabela TACO</h3>
            <p className={styles.tipsParagraph}>
              A Tabela TACO (Tabela Brasileira de Composição de Alimentos) foi desenvolvida pelo Núcleo 
              de Estudos e Pesquisas em Alimentação (NEPA) da UNICAMP. Ela contém dados sobre 
              a composição dos principais alimentos consumidos no Brasil.
            </p>
            <ul className={styles.tipsList}>
              <li>Valores nutricionais apresentados para 100g do alimento</li>
              <li>IG = Índice Glicêmico (quando disponível)</li>
              <li>Alimentos com IG baixo (&lt;55) são melhores para controle glicêmico</li>
              <li>Clique nos alimentos para ver informações nutricionais detalhadas</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}