export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  return new Date(date).toLocaleDateString('fr-FR', options);
};

export const formatRelativeTime = (date: string) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  return `il y a ${Math.floor(minutes / 60)}h`;
};