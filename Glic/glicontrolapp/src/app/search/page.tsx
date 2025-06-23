"use client";
import styles from './styleSearch.module.css';
import Link from 'next/link';
import Image from 'next/image';
import glicontrolLogo from '@/assets/glicontrol.png';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit, startAt, endAt } from 'firebase/firestore';
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

export default function Pesquisa() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Função para verificar se um objeto está vazio
  const isEmptyObject = (obj: any) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  };

  // Efeito para animar a entrada dos elementos
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Debug para exibir informações sobre a coleção
  useEffect(() => {
    const checkCollection = async () => {
      try {
        console.log("Verificando coleção tabela_taco...");
        const foodsRef = collection(db, 'tabela_taco');
        const snapshot = await getDocs(foodsRef);
        
        if (snapshot.empty) {
          console.log("A coleção está vazia!");
        } else {
          console.log(`A coleção tem ${snapshot.size} documentos.`);
          const firstDoc = snapshot.docs[0];
          console.log("Primeiro documento ID:", firstDoc.id);
          const data = firstDoc.data();
          console.log("Estrutura do primeiro documento:", data);
          console.log("Campos disponíveis:", Object.keys(data));
          
          if (isEmptyObject(data)) {
            console.log("ATENÇÃO: O documento existe mas não tem dados!");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar coleção:", error);
      }
    };
    
    checkCollection();
  }, []);

  // Carrega os alimentos mais comuns/recentes ao iniciar
  useEffect(() => {
    const fetchInitialFoods = async () => {
      try {
        setIsLoading(true);
        const foodsRef = collection(db, 'tabela_taco');
        // Buscamos todos os documentos sem ordenação para diagnóstico
        const q = query(foodsRef, limit(20));
        const querySnapshot = await getDocs(q);
        
        console.log("Total de documentos encontrados:", querySnapshot.size);
        
        const fetchedFoods: Food[] = [];
        querySnapshot.forEach((doc) => {
          // Log para diagnóstico - visualizar os campos disponíveis
          console.log("Documento ID:", doc.id);
          console.log("Dados do documento:", doc.data());
          
          const data = doc.data();
          // Tentando acessar campos com diferentes notações
          const descricao = 
            data['Descrição dos alimentos'] || 
            data['descricao'] || 
            data['Descricao dos alimentos'] ||
            data['descricao_dos_alimentos'] ||
            data['Descrição'] ||
            data.descricao ||
            "Alimento sem nome";
            
          fetchedFoods.push({
            id: doc.id,
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
            numero_alimento: parseFloat(data['Número do Alimento'] || data['numero_alimento'] || data.numero_alimento || 0),
            descricao: descricao
          });
        });
        
        setRecentFoods(fetchedFoods);
      } catch (error) {
        console.error("Erro ao carregar alimentos iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialFoods();
  }, []);

  // Efeito para pesquisar alimentos quando o termo é alterado
  useEffect(() => {
    const searchFoods = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        // Consulta ao Firestore
        const foodsRef = collection(db, 'tabela_taco');
        
        // Como a busca exata por campo não está funcionando, vamos buscar todos e filtrar no código
        const q = query(foodsRef, limit(100)); // Aumentamos o limite para ter mais resultados
        
        const querySnapshot = await getDocs(q);
        console.log("Documentos na pesquisa:", querySnapshot.size);
        
        const fetchedFoods: Food[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Recuperamos a descrição com várias alternativas de nomes de campo
          const descricao = 
            data['Descrição dos alimentos'] || 
            data['descricao'] || 
            data['Descricao dos alimentos'] ||
            data['descricao_dos_alimentos'] ||
            data['Descrição'] ||
            data.descricao ||
            "";
          
          // Filtramos manualmente pela string de busca
          if (descricao.toLowerCase().includes(searchTerm.toLowerCase())) {
            fetchedFoods.push({
              id: doc.id,
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
              numero_alimento: parseFloat(data['Número do Alimento'] || data['numero_alimento'] || data.numero_alimento || 0),
              descricao: descricao
            });
          }
        });
        
        setSearchResults(fetchedFoods);
      } catch (error) {
        console.error("Erro na pesquisa:", error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce para evitar muitas requisições
    const timer = setTimeout(() => {
      searchFoods();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    // Redireciona para a página de detalhes do alimento
    router.push(`/food/${food.id}`);
  };

  // Função para exibir macronutrientes formatados
  const formatNutrient = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(1) + 'g';
  };
  
  // Função para exibir calorias formatadas
  const formatCalories = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(0);
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
          
          {isSearching && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Buscando alimentos...</p>
            </div>
          )}

          {!isSearching && searchTerm && searchResults.length === 0 && (
            <div className={styles.noResults}>
              <p>Nenhum alimento encontrado para "{searchTerm}"</p>
              <span className={styles.sadFace}>😕</span>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className={styles.resultsContainer}>
              <h2 className={styles.resultsTitle}>Resultados da pesquisa</h2>
              <ul className={styles.resultsList}>
                {searchResults.map((food: Food) => (
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
                    {food.indiceGlicemico && (
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
            </div>
          )}

          {!searchTerm && !isLoading && recentFoods.length > 0 && (
            <div className={styles.recentFoodsContainer}>
              <ul className={styles.resultsList}>
                {recentFoods.map((food: Food) => (
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
                    {food.indiceGlicemico && (
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
            </div>
          )}

          {isLoading && !searchTerm && (
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