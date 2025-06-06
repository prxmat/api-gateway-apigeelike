// Dictionnaire global des transformations
export const Transformers = {
  // Génère un montant aléatoire entre 10 et 1000
  amount: () => Math.floor(Math.random() * (1000 - 10 + 1)) + 10,
  
  // Retourne une devise aléatoire
  currency: () => ['EUR', 'USD'][Math.floor(Math.random() * 2)],
  
  // Génère un timestamp
  timestamp: () => new Date().toISOString(),
  
  // Génère un ID de transaction
  transactionId: () => `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  
  // Retourne un statut
  status: () => 'completed',

  // Génère un nom aléatoire
  name: () => ['John', 'Jane', 'Bob', 'Alice'][Math.floor(Math.random() * 4)],

  // Génère un email aléatoire
  email: () => `${Math.random().toString(36).substring(2, 8)}@example.com`,

  // Génère un numéro de téléphone aléatoire
  phone: () => `+33${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,

  // Génère une adresse aléatoire
  address: () => `${Math.floor(Math.random() * 100)} rue de la Paix`,

  // Génère une ville aléatoire
  city: () => ['Paris', 'Lyon', 'Marseille', 'Bordeaux'][Math.floor(Math.random() * 4)],

  // Génère un code postal aléatoire
  zipCode: () => Math.floor(Math.random() * 90000 + 10000).toString(),

  // Génère un pays aléatoire
  country: () => ['France', 'USA', 'UK', 'Germany'][Math.floor(Math.random() * 4)],

  // Génère un numéro de carte aléatoire
  cardNumber: () => Array(4).fill(0).map(() => Math.floor(Math.random() * 10000).toString().padStart(4, '0')).join(''),

  // Génère une date d'expiration aléatoire
  expiryDate: () => {
    const month = Math.floor(Math.random() * 12) + 1;
    const year = new Date().getFullYear() + Math.floor(Math.random() * 5);
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  }
}; 