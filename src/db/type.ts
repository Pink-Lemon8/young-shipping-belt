export interface ContactNumber {
  id?: string;
  isDefault?: boolean;
  code?: string;
  area?: string;
  number: string;
}

export interface Address {
  id?: string;
  name?: string;
  isDefault?: boolean;
  street: string;
  street2?: string;
  street3?: string;
  city: string;
  province?: string;
  country: string;
  postalCode?: string;
  phone?: ContactNumber;
  fax?: ContactNumber;
}

export interface PriceTier {
  quantity: string;
  price: string;
}

export interface AffiliateMetadata {
  [key: string]: any;
}
