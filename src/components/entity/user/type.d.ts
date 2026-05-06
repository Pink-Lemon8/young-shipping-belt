import { File } from "../file/type";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  imageFile?: File;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  banned: string | null;
  banReason: string | null;
  banExpires: string | null;
  twoFactorEnabled: string | null;
  department: string | null;
  beltCode: string | null;
  affiliates: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};
