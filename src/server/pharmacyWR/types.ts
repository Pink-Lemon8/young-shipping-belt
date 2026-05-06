
export interface ContactNumber {
  code?: string;
  area: string;
  number: string;
}

export interface Address {
  name?: string;
  pwAddressId?: string;
  street: string;
  street2?: string;
  street3?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: ContactNumber;
  fax?: ContactNumber;
}

export interface PriceTier {
  quantity: string;
  price: string;
}

export interface Patient {
  userId?: number;

  pwPatientId: string;
  pwUsername: string;
  pwPassword?: string;

  firstName: string;
  lastName: string;
  birthDate: string;

  phone?: ContactNumber;
  fax?: ContactNumber;

  gender: "MALE" | "FEMALE";
  billingAddress?: Address;
}

export interface PaymentCard {
  id?: string;
  name?: string;
  number: string;
  expirationDate: string;
  cvv: string;
}