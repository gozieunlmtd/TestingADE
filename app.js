/**
 * NutriTrack - Core Client-Side Logic
 * Pure Vanilla JavaScript with LocalStorage Persistence
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEYS = {
    SETTINGS: 'nutritrack_settings',
    ENTRIES: 'nutritrack_entries'
  };

  // --- Default State ---
  const DEFAULT_SETTINGS = {
    calories: 2000,
    protein: 130,
    carbs: 210,
    fat: 65
  };

  // Sample items for demonstration
  const SAMPLE_ITEMS = [
    { name: 'Oatmeal with Blueberries & Honey', calories: 310, protein: 9, carbs: 58, fat: 5, mealType: 'Breakfast' },
    { name: 'Black Coffee with Splash of Almond Milk', calories: 25, protein: 1, carbs: 2, fat: 1, mealType: 'Breakfast' },
    { name: 'Grilled Chicken Salad with Olive Oil', calories: 480, protein: 42, carbs: 14, fat: 28, mealType: 'Lunch' },
    { name: 'Whole Grain Sourdough Roll', calories: 150, protein: 5, carbs: 29, fat: 1, mealType: 'Lunch' },
    { name: 'Baked Salmon with Quinoa & Asparagus', calories: 560, protein: 46, carbs: 42, fat: 22, mealType: 'Dinner' },
    { name: 'Greek Yogurt with Walnuts', calories: 210, protein: 18, carbs: 8, fat: 12, mealType: 'Snacks' },
    { name: 'Green Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, mealType: 'Snacks' }
  ];

  // --- Application State ---
  let currentDate = getTodayDateString();
  let settings = loadSettings();
  let entries = loadEntries();

  // If brand new user (first visit), initialize with today's sample entries
  if (entries.length === 0) {
    seedInitialData();
  }

  // --- DOM Elements ---
  const elDateInput = document.getElementById('selected-date');
  const elDateLabel = document.getElementById('date-display-label');
  const elPrevDayBtn = document.getElementById('prev-day-btn');
  const elNextDayBtn = document.getElementById('next-day-btn');
  const elTodayBtn = document.getElementById('today-btn');

  // Calorie summary
  const elConsumedCalories = document.getElementById('consumed-calories');
  const elTargetCalories = document.getElementById('target-calories');
  const elRemainingCalories = document.getElementById('remaining-calories');
  const elRemainingLabel = document.getElementById('remaining-label');
  const elCalorieProgressBar = document.getElementById('calorie-progress-fill');
  const elCaloriePercentText = document.getElementById('calorie-percent-text');
  const elCalorieOverText = document.getElementById('calorie-over-text');
  const elCalorieStatusBadge = document.getElementById('calorie-status-badge');

  // Macro summary
  const elProteinTotal = document.getElementById('protein-total');
  const elProteinTarget = document.getElementById('protein-target');
  const elProteinBar = document.getElementById('protein-bar');
  const elCarbsTotal = document.getElementById('carbs-total');
  const elCarbsTarget = document.getElementById('carbs-target');
  const elCarbsBar = document.getElementById('carbs-bar');
  const elFatTotal = document.getElementById('fat-total');
  const elFatTarget = document.getElementById('fat-target');
  const elFatBar = document.getElementById('fat-bar');
  const elProteinCalsCalc = document.getElementById('protein-cals-calc');
  const elCarbsCalsCalc = document.getElementById('carbs-cals-calc');
  const elFatCalsCalc = document.getElementById('fat-cals-calc');

  // Meal totals
  const elBreakfastTotal = document.getElementById('breakfast-total');
  const elLunchTotal = document.getElementById('lunch-total');
  const elDinnerTotal = document.getElementById('dinner-total');
  const elSnacksTotal = document.getElementById('snacks-total');

  // Meal containers
  const elBreakfastItems = document.getElementById('breakfast-items');
  const elLunchItems = document.getElementById('lunch-items');
  const elDinnerItems = document.getElementById('dinner-items');
  const elSnacksItems = document.getElementById('snacks-items');

  // Modals
  const elFoodModal = document.getElementById('food-modal');
  const elFoodForm = document.getElementById('food-form');
  const elFoodModalTitle = document.getElementById('food-modal-title');
  const elFoodEntryId = document.getElementById('food-entry-id');
  const elFoodName = document.getElementById('food-name');
  const elFoodMeal = document.getElementById('food-meal');
  const elFoodCalories = document.getElementById('food-calories');
  const elFoodProtein = document.getElementById('food-protein');
  const elFoodCarbs = document.getElementById('food-carbs');
  const elFoodFat = document.getElementById('food-fat');

  const elOpenAddFoodBtn = document.getElementById('open-add-food-btn');
  const elCloseFoodModalBtn = document.getElementById('close-food-modal-btn');
  const elCancelFoodModalBtn = document.getElementById('cancel-food-modal-btn');

  // Settings modal
  const elSettingsModal = document.getElementById('settings-modal');
  const elSettingsForm = document.getElementById('settings-form');
  const elSettingCalories = document.getElementById('setting-calories');
  const elSettingProtein = document.getElementById('setting-protein');
  const elSettingCarbs = document.getElementById('setting-carbs');
  const elSettingFat = document.getElementById('setting-fat');
  const elOpenSettingsBtn = document.getElementById('open-settings-btn');
  const elCloseSettingsModalBtn = document.getElementById('close-settings-modal-btn');
  const elCancelSettingsBtn = document.getElementById('cancel-settings-btn');

  // Footer / Global buttons
  const elClearDayBtn = document.getElementById('clear-day-btn');
  const elLoadSampleBtn = document.getElementById('load-sample-btn');
  const elExportBtn = document.getElementById('export-btn');
  const elToast = document.getElementById('toast');

  // --- Helper Functions ---

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateStr) {
    const today = getTodayDateString();
    if (dateStr === today) return 'Today';

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // Check yesterday / tomorrow
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
    if (dateStr === yStr) return 'Yesterday';

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;
    if (dateStr === tStr) return 'Tomorrow';

    // Formatted date (e.g., Nov 12, 2026)
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse entries from localStorage', e);
    }
    return [];
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries', e);
    }
  }

  function seedInitialData() {
    const today = getTodayDateString();
    entries = SAMPLE_ITEMS.map(item => ({
      id: generateId(),
      date: today,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      mealType: item.mealType
    }));
    saveEntries();
  }

  function showToast(message) {
    elToast.textContent = message;
    elToast.classList.add('show');
    clearTimeout(elToast._timer);
    elToast._timer = setTimeout(() => {
      elToast.classList.remove('show');
    }, 2500);
  }

  // --- Rendering UI ---

  function render() {
    // 1. Sync Date input and label
    elDateInput.value = currentDate;
    elDateLabel.textContent = formatDateForDisplay(currentDate);

    // 2. Filter entries for selected date
    const dayEntries = entries.filter(item => item.date === currentDate);

    // 3. Totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealTotals = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snacks: 0
    };

    const mealItems = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: []
    };

    dayEntries.forEach(item => {
      const cals = Number(item.calories) || 0;
      const p = Number(item.protein) || 0;
      const c = Number(item.carbs) || 0;
      const f = Number(item.fat) || 0;

      totalCalories += cals;
      totalProtein += p;
      totalCarbs += c;
      totalFat += f;

      const meal = item.mealType || 'Snacks';
      if (mealTotals[meal] !== undefined) {
        mealTotals[meal] += cals;
        mealItems[meal].push(item);
      } else {
        mealTotals.Snacks += cals;
        mealItems.Snacks.push(item);
      }
    });

    // 4. Update Calorie Target Dashboard
    elConsumedCalories.textContent = totalCalories.toLocaleString();
    elTargetCalories.textContent = settings.calories.toLocaleString();

    const remaining = settings.calories - totalCalories;
    if (remaining >= 0) {
      elRemainingCalories.textContent = remaining.toLocaleString();
      elRemainingCalories.className = 'stat-number highlight';
      elRemainingLabel.textContent = 'Remaining';
      elCalorieOverText.style.display = 'none';
      elCalorieStatusBadge.className = 'badge badge-success';
      elCalorieStatusBadge.textContent = remaining === 0 ? 'Goal Met' : 'On Track';
    } else {
      elRemainingCalories.textContent = Math.abs(remaining).toLocaleString();
      elRemainingCalories.className = 'stat-number text-danger';
      elRemainingLabel.textContent = 'Over Target';
      elCalorieOverText.style.display = 'inline';
      elCalorieOverText.textContent = `+${Math.abs(remaining)} kcal over`;
      elCalorieStatusBadge.className = 'badge badge-danger';
      elCalorieStatusBadge.textContent = 'Target Exceeded';
    }

    const pct = settings.calories > 0 ? (totalCalories / settings.calories) * 100 : 0;
    elCalorieProgressBar.style.width = Math.min(pct, 100) + '%';
    if (pct > 100) {
      elCalorieProgressBar.classList.add('exceeded');
    } else {
      elCalorieProgressBar.classList.remove('exceeded');
    }
    elCaloriePercentText.textContent = `${Math.round(pct)}% of daily goal`;

    // 5. Update Macros
    elProteinTotal.textContent = Math.round(totalProtein);
    elProteinTarget.textContent = settings.protein;
    const proteinPct = settings.protein > 0 ? Math.min((totalProtein / settings.protein) * 100, 100) : 0;
    elProteinBar.style.width = `${proteinPct}%`;

    elCarbsTotal.textContent = Math.round(totalCarbs);
    elCarbsTarget.textContent = settings.carbs;
    const carbsPct = settings.carbs > 0 ? Math.min((totalCarbs / settings.carbs) * 100, 100) : 0;
    elCarbsBar.style.width = `${carbsPct}%`;

    elFatTotal.textContent = Math.round(totalFat);
    elFatTarget.textContent = settings.fat;
    const fatPct = settings.fat > 0 ? Math.min((totalFat / settings.fat) * 100, 100) : 0;
    elFatBar.style.width = `${fatPct}%`;

    // Macro calorie proportions (Protein 4kcal/g, Carbs 4kcal/g, Fat 9kcal/g)
    const proteinCals = totalProtein * 4;
    const carbsCals = totalCarbs * 4;
    const fatCals = totalFat * 9;
    const macroCalsSum = proteinCals + carbsCals + fatCals || 1;

    elProteinCalsCalc.textContent = `${Math.round(proteinCals)} kcal (${Math.round((proteinCals / macroCalsSum) * 100)}%)`;
    elCarbsCalsCalc.textContent = `${Math.round(carbsCals)} kcal (${Math.round((carbsCals / macroCalsSum) * 100)}%)`;
    elFatCalsCalc.textContent = `${Math.round(fatCals)} kcal (${Math.round((fatCals / macroCalsSum) * 100)}%)`;

    // 6. Update Meal Subtotals & Lists
    elBreakfastTotal.textContent = `${mealTotals.Breakfast.toLocaleString()} kcal`;
    elLunchTotal.textContent = `${mealTotals.Lunch.toLocaleString()} kcal`;
    elDinnerTotal.textContent = `${mealTotals.Dinner.toLocaleString()} kcal`;
    elSnacksTotal.textContent = `${mealTotals.Snacks.toLocaleString()} kcal`;

    renderMealList(elBreakfastItems, mealItems.Breakfast);
    renderMealList(elLunchItems, mealItems.Lunch);
    renderMealList(elDinnerItems, mealItems.Dinner);
    renderMealList(elSnacksItems, mealItems.Snacks);
  }

  function renderMealList(container, items) {
    container.innerHTML = '';

    if (items.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-meal-state';
      emptyDiv.textContent = 'No foods logged yet.';
      container.appendChild(emptyDiv);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'food-row';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'food-row-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'food-row-name';
      nameSpan.textContent = item.name;
      infoDiv.appendChild(nameSpan);

      // Macro badge breakdown
      const p = Number(item.protein) || 0;
      const c = Number(item.carbs) || 0;
      const f = Number(item.fat) || 0;

      if (p > 0 || c > 0 || f > 0) {
        const macrosDiv = document.createElement('div');
        macrosDiv.className = 'food-row-macros';
        if (p > 0) {
          macrosDiv.innerHTML += `<span class="badge-macro badge-macro-p">P: ${p}g</span>`;
        }
        if (c > 0) {
          macrosDiv.innerHTML += `<span class="badge-macro badge-macro-c">C: ${c}g</span>`;
        }
        if (f > 0) {
          macrosDiv.innerHTML += `<span class="badge-macro badge-macro-f">F: ${f}g</span>`;
        }
        infoDiv.appendChild(macrosDiv);
      }

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'food-row-actions';

      const calsSpan = document.createElement('span');
      calsSpan.className = 'food-row-calories';
      calsSpan.textContent = `${Number(item.calories).toLocaleString()} kcal`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.title = 'Remove item';
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => {
        deleteEntry(item.id);
      });

      actionsDiv.appendChild(calsSpan);
      actionsDiv.appendChild(deleteBtn);

      row.appendChild(infoDiv);
      row.appendChild(actionsDiv);
      container.appendChild(row);
    });
  }

  // --- Date Actions ---

  function shiftDate(days) {
    const [year, month, day] = currentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + days);

    const newYear = dateObj.getFullYear();
    const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newDay = String(dateObj.getDate()).padStart(2, '0');
    currentDate = `${newYear}-${newMonth}-${newDay}`;
    render();
  }

  // --- Entry Actions ---

  function addEntry(itemData) {
    const newEntry = {
      id: generateId(),
      date: currentDate,
      name: itemData.name.trim(),
      calories: Math.max(0, Math.round(Number(itemData.calories) || 0)),
      protein: Math.max(0, Number(itemData.protein) || 0),
      carbs: Math.max(0, Number(itemData.carbs) || 0),
      fat: Math.max(0, Number(itemData.fat) || 0),
      mealType: itemData.mealType || 'Snacks'
    };

    entries.push(newEntry);
    saveEntries();
    render();
    showToast(`Logged "${newEntry.name}"`);
  }

  function deleteEntry(id) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      const removed = entries.splice(idx, 1)[0];
      saveEntries();
      render();
      showToast(`Removed "${removed.name}"`);
    }
  }

  function clearDayEntries() {
    const count = entries.filter(e => e.date === currentDate).length;
    if (count === 0) {
      showToast('No entries for this date.');
      return;
    }

    if (confirm(`Remove all ${count} food item(s) logged for ${formatDateForDisplay(currentDate)}?`)) {
      entries = entries.filter(e => e.date !== currentDate);
      saveEntries();
      render();
      showToast('Entries cleared for today.');
    }
  }

  // --- Modal Management ---

  function openFoodModal(preselectedMeal) {
    elFoodEntryId.value = '';
    elFoodName.value = '';
    elFoodCalories.value = '';
    elFoodProtein.value = '';
    elFoodCarbs.value = '';
    elFoodFat.value = '';
    if (preselectedMeal) {
      elFoodMeal.value = preselectedMeal;
    }
    elFoodModalTitle.textContent = 'Log Food Item';
    elFoodModal.classList.add('active');
    setTimeout(() => elFoodName.focus(), 50);
  }

  function closeFoodModal() {
    elFoodModal.classList.remove('active');
  }

  function openSettingsModal() {
    elSettingCalories.value = settings.calories;
    elSettingProtein.value = settings.protein;
    elSettingCarbs.value = settings.carbs;
    elSettingFat.value = settings.fat;
    elSettingsModal.classList.add('active');
    setTimeout(() => elSettingCalories.focus(), 50);
  }

  function closeSettingsModal() {
    elSettingsModal.classList.remove('active');
  }

  // --- Export Data ---

  function exportData() {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: settings,
      entries: entries
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack_backup_${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
  }

  // --- Event Listeners ---

  // Date controls
  elPrevDayBtn.addEventListener('click', () => shiftDate(-1));
  elNextDayBtn.addEventListener('click', () => shiftDate(1));
  elTodayBtn.addEventListener('click', () => {
    currentDate = getTodayDateString();
    render();
  });
  elDateInput.addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      render();
    }
  });

  // Food Modal triggers
  elOpenAddFoodBtn.addEventListener('click', () => openFoodModal());
  elCloseFoodModalBtn.addEventListener('click', closeFoodModal);
  elCancelFoodModalBtn.addEventListener('click', closeFoodModal);

  // Per-meal section "+ Add" buttons
  document.querySelectorAll('.meal-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const meal = e.currentTarget.getAttribute('data-meal-target');
      openFoodModal(meal);
    });
  });

  // Food Form submit
  elFoodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = elFoodName.value.trim();
    const calories = elFoodCalories.value;
    const meal = elFoodMeal.value;
    const protein = elFoodProtein.value;
    const carbs = elFoodCarbs.value;
    const fat = elFoodFat.value;

    if (!name || !calories) return;

    addEntry({
      name: name,
      calories: calories,
      mealType: meal,
      protein: protein,
      carbs: carbs,
      fat: fat
    });

    closeFoodModal();
  });

  // Quick preset chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.getAttribute('data-name');
      const cals = chip.getAttribute('data-cals');
      const p = chip.getAttribute('data-p');
      const c = chip.getAttribute('data-c');
      const f = chip.getAttribute('data-f');
      const meal = chip.getAttribute('data-meal');

      addEntry({
        name: name,
        calories: cals,
        protein: p,
        carbs: c,
        fat: f,
        mealType: meal
      });
    });
  });

  // Settings triggers & submit
  elOpenSettingsBtn.addEventListener('click', openSettingsModal);
  elCloseSettingsModalBtn.addEventListener('click', closeSettingsModal);
  elCancelSettingsBtn.addEventListener('click', closeSettingsModal);

  elSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cals = parseInt(elSettingCalories.value, 10);
    const p = parseInt(elSettingProtein.value, 10) || 0;
    const c = parseInt(elSettingCarbs.value, 10) || 0;
    const f = parseInt(elSettingFat.value, 10) || 0;

    if (cals > 0) {
      settings.calories = cals;
      settings.protein = p;
      settings.carbs = c;
      settings.fat = f;
      saveSettings();
      render();
      closeSettingsModal();
      showToast('Goal settings updated!');
    }
  });

  // Footer controls
  elClearDayBtn.addEventListener('click', clearDayEntries);

  elLoadSampleBtn.addEventListener('click', () => {
    SAMPLE_ITEMS.forEach(item => {
      entries.push({
        id: generateId(),
        date: currentDate,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        mealType: item.mealType
      });
    });
    saveEntries();
    render();
    showToast('Loaded sample items for this date!');
  });

  elExportBtn.addEventListener('click', exportData);

  // Close modals on escape key or clicking backdrop
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFoodModal();
      closeSettingsModal();
    }
  });

  [elFoodModal, elSettingsModal].forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  // --- Initial Render ---
  render();
})();

