export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'stagiaire';
  photo?: string;
  promotion?: string;
  date_debut?: string;
  date_fin?: string;
}

export interface Pointage {
  id: number;
  date: string;
  heure_arrivee?: string;
  heure_sortie?: string;
  statut: 'present' | 'retard' | 'absent' | 'justifie';
  note?: string;
  duree?: string;
}

export interface Sanction {
  id: number;
  niveau: 'avertissement' | 'blame' | 'suspension' | 'exclusion';
  motif: string;
  description: string;
  date_sanction: string;
  coach_nom?: string;
  est_lue: boolean;
}

export interface Stats {
  mois_actuel: {
    present: number;
    retard: number;
    absent: number;
    justifie: number;
    total_jours: number;
  };
  pourcentage_presence: number;
}

export interface Notification {
  id: string;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
}