import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  onSnapshot,
  query,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  QuerySnapshot,
  Unsubscribe,
  FirestoreError
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface FirestoreCollectionUpdate<T = DocumentData> {
  data: T[];
  error?: FirestoreError;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private db: Firestore;
  private activeSubscriptions = new Map<string, Unsubscribe>();
  private collectionSubjects = new Map<string, BehaviorSubject<FirestoreCollectionUpdate>>();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();

  constructor() {
    // Initialize Firebase with environment config
    this.app = initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  /**
   * Escucha cambios en una colección de Firestore en tiempo real
   * @param collectionName Nombre de la colección a escuchar
   * @param constraints Constraints opcionales para filtrar la consulta (ej: where, orderBy, limit)
   * @returns Observable con los datos de la colección
   */
  listenToCollection<T = DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Observable<FirestoreCollectionUpdate<T>> {
    const key = this.getCollectionKey(collectionName, constraints);

    // Si ya existe un subject para esta colección, retornar el observable
    if (this.collectionSubjects.has(key)) {
      return this.collectionSubjects.get(key)!.asObservable() as Observable<FirestoreCollectionUpdate<T>>;
    }

    // Crear nuevo subject para esta colección
    const subject = new BehaviorSubject<FirestoreCollectionUpdate>({
      data: []
    });

    this.collectionSubjects.set(key, subject);

    // Crear referencia a la colección
    const collectionRef = collection(this.db, collectionName) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

    // Suscribirse a los cambios en la colección
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<T>) => {
        const data:any = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];

        if (!this.connectedSubject.value) this.connectedSubject.next(true);
        subject.next({ data });
      },
      (error: FirestoreError) => {
        console.error(`Error listening to collection ${collectionName}:`, error);
        subject.next({
          data: subject.value.data,
          error
        });
      }
    );

    // Guardar la función de desuscripción
    this.activeSubscriptions.set(key, unsubscribe);

    return subject.asObservable() as Observable<FirestoreCollectionUpdate<T>>;
  }

  /**
   * Detiene la escucha de una colección específica
   * @param collectionName Nombre de la colección
   * @param constraints Constraints usados en la suscripción original
   */
  unsubscribeFromCollection(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): void {
    const key = this.getCollectionKey(collectionName, constraints);

    const unsubscribe = this.activeSubscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(key);
      this.collectionSubjects.delete(key);
    }
  }

  /**
   * Detiene todas las suscripciones activas
   */
  unsubscribeAll(): void {
    this.activeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.activeSubscriptions.clear();
    this.collectionSubjects.clear();
  }

  /**
   * Obtiene la instancia de Firestore para operaciones manuales
   */
  getFirestore(): Firestore {
    return this.db;
  }

  /**
   * Genera una clave única para identificar una suscripción a colección
   */
  private getCollectionKey(collectionName: string, constraints: QueryConstraint[]): string {
    const constraintsKey = constraints.length > 0
      ? JSON.stringify(constraints.map(c => c.type))
      : 'none';
    return `${collectionName}__${constraintsKey}`;
  }

  /**
   * Limpia todas las suscripciones al destruir el servicio
   */
  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}
