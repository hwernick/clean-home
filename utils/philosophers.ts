export type Philosopher = {
  name: string;
  id: string;
};

export const MAJOR_PHILOSOPHERS: Record<string, Philosopher> = {
  'socrates': { name: 'Socrates', id: 'Q913' },
  'plato': { name: 'Plato', id: 'Q859' },
  'aristotle': { name: 'Aristotle', id: 'Q868' },
  'mill': { name: 'John Stuart Mill', id: 'Q12718' },
  'locke': { name: 'John Locke', id: 'Q9359' },
  'descartes': { name: 'René Descartes', id: 'Q9191' },
  'nietzsche': { name: 'Friedrich Nietzsche', id: 'Q9358' }
}; 