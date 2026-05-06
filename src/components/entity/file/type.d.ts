export type File = {
  id: number;
  customId?: string;
  url?: string;
  key?: string;
  name?: string;
  size?: number;
  type?: string;
  description?: string;
  isPublic?: boolean;
  hash?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
