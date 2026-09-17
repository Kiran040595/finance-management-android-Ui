import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSE_STORAGE_KEY = '@vf_business_expenses_v1';

export const EXPENSE_CATEGORIES = [
  { id: 'FUEL', label: 'Fuel / Travel Allowance', icon: 'speedometer-outline' },
  { id: 'SALARY', label: 'Staff Salary & Commission', icon: 'people-outline' },
  { id: 'RENT', label: 'Office Rent & Utilities', icon: 'business-outline' },
  { id: 'LEGAL', label: 'Legal & Demand Notices', icon: 'document-text-outline' },
  { id: 'RTO', label: 'RTO & Seizure Yard Fees', icon: 'shield-outline' },
  { id: 'OFFICE', label: 'Stationery & Refreshments', icon: 'cafe-outline' },
  { id: 'OTHER', label: 'Other Operational Expense', icon: 'ellipsis-horizontal-circle-outline' },
];

let inMemoryExpenses = null;

export const expenseService = {
  async getExpenses() {
    if (inMemoryExpenses) return [...inMemoryExpenses];
    try {
      const stored = await AsyncStorage.getItem(EXPENSE_STORAGE_KEY);
      if (stored) {
        inMemoryExpenses = JSON.parse(stored);
      } else {
        // Seed initial sample expenses for current month demonstration
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const initial = [
          {
            id: `EXP-${y}${m}-01`,
            title: 'Field Agent Fuel & Travel Allowance',
            category: 'Fuel / Travel Allowance',
            amount: 2500,
            date: `${y}-${m}-05`,
            notes: 'Collection travel for outer rural areas',
            agentName: 'Admin',
          },
          {
            id: `EXP-${y}${m}-02`,
            title: 'Office Monthly Rent & Electricity',
            category: 'Office Rent & Utilities',
            amount: 8000,
            date: `${y}-${m}-01`,
            notes: 'Main branch office rent',
            agentName: 'Admin',
          },
        ];
        inMemoryExpenses = initial;
        await AsyncStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('Error reading expenses from storage:', e);
      inMemoryExpenses = [];
    }
    return [...inMemoryExpenses];
  },

  async getExpensesByMonth(year, month) {
    const all = await this.getExpenses();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return all.filter((exp) => (exp.date || '').startsWith(monthPrefix));
  },

  async addExpense(expenseData) {
    const all = await this.getExpenses();
    const newEntry = {
      id: `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: expenseData.title || 'General Expense',
      category: expenseData.category || 'Other Operational Expense',
      amount: parseFloat(expenseData.amount || 0),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      notes: expenseData.notes || '',
      agentName: expenseData.agentName || 'Admin',
    };

    all.unshift(newEntry);
    inMemoryExpenses = all;
    try {
      await AsyncStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Error persisting expense:', e);
    }
    return newEntry;
  },

  async deleteExpense(id) {
    const all = await this.getExpenses();
    const filtered = all.filter((exp) => exp.id !== id);
    inMemoryExpenses = filtered;
    try {
      await AsyncStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error deleting expense:', e);
    }
    return true;
  },
};

export default expenseService;
