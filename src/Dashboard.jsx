import { React, useState } from 'react';

import CategoriesList from './CategoriesList';
import CategoryDetails from './CategoryDetails';
import ProductsScanList from './ProductsScanList';
import SettingsModal from './SettingsModal';

const Dashboard = () => {
  const [currentSection, setCurrentSection] = useState('');
  const [currentCategoryRegion, setCurrentCategoryRegion] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const mainCategories = {
    "com": {
      name: "USA",
      subCategories: [
        { id: 2619526011, name: "Appliances" },
        { id: 2617942011, name: "Arts & Crafts" },
        { id: 15690151, name: "Automotive" },
        { id: 165797011, name: "Baby" }
      ]
    },
    "de": {
      name: "Germany",
      subCategories: [
        { id: 78689031, name: "Bekleidung" },
        { id: 931573031, name: "Elektro-Großgeräte" },
        { id: 78193031, name: "Auto & Motorrad" },
        { id: 357577011, name: "Baby" }
      ]
    }
  };

  const mainCategoriesEntries = [
    { region: "com", name: "USA (https://www.amazon.com)", active: true },
    { region: "de", name: "Germany (https://www.amazon.de)", active: false }
  ];

  const productScanEntries = [
    { id: "a5c1...", type: "Category", region: "Germany", category: "Bekleidung", minRank: 1, maxRank: 10000 },
    { id: "a5c2...", type: "ASINs", region: "USA", category: "Arts & Crafts", minRank: 1, maxRank: 10000 },
    { id: "a5c3...", type: "Deals", region: "USA", category: "Appliances", minRank: 1, maxRank: 10000 }
  ];

  const sectionStyle = "w-full text-left p-2 border-b border-white hover:bg-indigo-500 hover:cursor-pointer";
  const selectedSectionStyle = "w-full bg-indigo-400 text-left p-2 border-b border-white hover:bg-indigo-500 hover:cursor-pointer";

  let section;
  if (currentSection == "categories") {
    section = <CategoriesList mainCategoriesEntries={mainCategoriesEntries} currentCategoryRegion={currentCategoryRegion} setCurrentCategoryRegion={setCurrentCategoryRegion} />;
  } else if (currentSection == "products") {
    section = <ProductsScanList productScanEntries={productScanEntries} />;
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
      
        <button className="button bg-red-500 hover:bg-sky-700">Logout</button>
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
          {section}
        </div>

        <div className="w-1/2 p-4">
          { currentCategoryRegion && <CategoryDetails mainCategory={mainCategories[currentCategoryRegion]} /> }
        </div>
      </div>

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
