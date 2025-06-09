import { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import RegionCategoriesList from './RegionCategoriesList';
import RegionCategoriesDetails from './RegionCategoriesDetails';
import ScansList from './ScansList';
import ScanDetails from './ScanDetails';
import NewScanModal from './NewScanModal';
import config from './config';

const Dashboard = ({ setIsLoggedIn }) => {
  const [currentSection, setCurrentSection] = useState('');
  const [currentScanId, setCurrentScanId] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
  const [currentScanProductsPagination, setCurrentScanProductsPagination] = useState({ current: 5, total: 10 });
  const [currentCategoryRegion, setCurrentCategoryRegion] = useState('');
  const [productScanEntries, setProductScanEntries] = useState([
    { id: "a5c1", type: "Category", region: "Germany", category: "Bekleidung", minRank: 1, maxRank: 10000, state: "enqueued" },
    { id: "a5c2", type: "ASINs", region: "USA", category: "Arts & Crafts", minRank: 1, maxRank: 10000, state: "enqueued" },
    { id: "a5c3", type: "Deals", region: "USA", category: "Appliances", minRank: 1, maxRank: 10000, state: "active" }
  ]);
  const [mainCategoriesEntries, setMainCategoriesEntries] = useState([]);
  const [mainCategories, setMainCategories] = useState([
    {
      isComplete: false,
      region: "amazon.com",
      isCompleted: false,
      subCategories: [
        { id: 2619526011, name: "Appliances" },
        { id: 2617942011, name: "Arts & Crafts" },
        { id: 15690151, name: "Automotive" },
        { id: 165797011, name: "Baby" }
      ]
    },
    {
      isComplete: false,
      name: "amazon.de",
      subCategories: [
        { id: 78689031, name: "Bekleidung" },
        { id: 931573031, name: "Elektro-Großgeräte" },
        { id: 78193031, name: "Auto & Motorrad" },
        { id: 357577011, name: "Baby" }
      ]
    }
  ]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/amazon/regions`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.regions) {
          const regions = data.regions.map((region, index) => ({
            region: `https://www.amazon.${region}`,
            active: index === 0 // Set first region as active by default
          }));
          setMainCategoriesEntries(regions);
          // Update mainCategories with fetched regions, preserving existing subCategories for known regions
          setMainCategories((prev) => {
            const newCategories = {};
            regions.forEach(({ region }) => {
              const domain = region.split('.').pop();
              newCategories[domain] = prev[domain] || {
                isBeingUpdated: false,
                name: domain.toUpperCase(), // Fallback name
                subCategories: []
              };
            });
            return newCategories;
          });
        }
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      }
    };
    fetchRegions();
  }, []);

  const scanProducts = [
    {
      id: "a5c1",
      products: [
        { id: "", asin: "5467HGYU", title: "" },
        {},
      ],
    },
    {}
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.message === 'Logged out successfully') {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateScan = (newScan) => {
    setProductScanEntries(prev => [...prev, newScan]);
  };

  const sectionStyle = "w-full text-left p-2 border-b border-white hover:bg-indigo-500 hover:cursor-pointer";
  const selectedSectionStyle = "w-full bg-indigo-400 text-left p-2 border-b border-white hover:bg-indigo-500 hover:cursor-pointer";

  let section;
  let details;
  if (currentSection === "categories") {
    section = <RegionCategoriesList mainCategoriesEntries={mainCategoriesEntries} currentCategoryRegion={currentCategoryRegion} setCurrentCategoryRegion={setCurrentCategoryRegion} />;
    details = currentCategoryRegion && <RegionCategoriesDetails mainCategory={mainCategories[currentCategoryRegion.split('.').pop()]} />;
  } else if (currentSection === "products") {
    section = <ScansList productScanEntries={productScanEntries} currentScanId={currentScanId} setCurrentScanId={setCurrentScanId} />;
    details = currentScanId && <ScanDetails scan={productScanEntries.find(entry => entry.id === currentScanId)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white">
        <span className="text-xl font-bold">Rankey</span>
        <button className="button hover:bg-indigo-700" onClick={() => setIsSettingsModalOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
        <button
          className="button bg-red-500 hover:bg-red-700 text-white p-2 rounded-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="flex flex-1">
        <div className="w-1/6 border-r border-white">
          <button
            onClick={() => setCurrentSection("categories")}
            className={currentSection === "categories" ? selectedSectionStyle : sectionStyle}
          >
            Categories
          </button>
          <button
            onClick={() => setCurrentSection("products")}
            className={currentSection === "products" ? selectedSectionStyle : sectionStyle}
          >
            Product scans
          </button>
        </div>

        <div className="w-1/2 border-r border-white">
          {currentSection === "products" && (
            <button
              className="button bg-red-500 hover:bg-red-700 text-white p-2 m-2 rounded-md"
              onClick={() => setIsNewScanModalOpen(true)}
            >
              New
            </button>
          )}
          {section}
        </div>
        <div className="w-1/2">{details}</div>
      </div>

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <NewScanModal
        isOpen={isNewScanModalOpen}
        onClose={() => setIsNewScanModalOpen(false)}
        onCreateScan={handleCreateScan}
      />
    </div>
  );
};

export default Dashboard;