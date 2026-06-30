/** Ét foto i et indflytningssyn (Storage-sti + download-URL). */
export type InspectionPhoto = { path: string; url: string };

/** En post i indflytningssynet (fejl/mangel) — knyttet til en bolig (homeId). */
export type InspectionItem = {
  homeId: string;
  room?: string;
  title: string;
  notes?: string;
  photos: InspectionPhoto[];
  createdAt: string;
  updatedAt: string;
};

export type InspectionItemInput = Pick<InspectionItem, 'homeId' | 'room' | 'title' | 'notes'>;
