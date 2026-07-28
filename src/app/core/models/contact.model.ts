export interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  badge_color: string;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  badgeColor: string;
  authUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface UpdateContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
}