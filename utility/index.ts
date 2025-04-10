
export const truncateFileName = (name: string) => {
  if (name.length < 50) return name;
  const index = name.lastIndexOf(".")
  return `${name.slice(0, Math.min(index, 30))}..${name.slice(index)}`
}

export const formatFileSize = (size: number) => {
  if (size === 0) return '0B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / Math.pow(1024, i);

  return `${Math.floor(value)}${units[i]}`;
}