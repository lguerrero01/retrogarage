import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Wifi, WifiOff, RefreshCw } from 'lucide-angular';
import { FirebaseService } from '../../services/firebase.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.css']
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  Wifi = Wifi;
  WifiOff = WifiOff;
  RefreshCw = RefreshCw;

  isConnected = false;
  isReconnecting = false;

  private subscription?: Subscription;

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.subscription = this.firebaseService.connected$.subscribe(status => {
      this.isConnected = status;
      if (status) {
        this.isReconnecting = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  reconnect() {
    this.isReconnecting = true;
    window.location.reload();
  }

  getStatusIcon() {
    return this.isConnected ? this.Wifi : this.WifiOff;
  }

  getStatusClass(): string {
    return this.isConnected
      ? 'bg-green-500/20 text-green-300'
      : 'bg-red-500/20 text-red-300';
  }

  getStatusText(): string {
    if (this.isReconnecting) {
      return 'Reconectando...';
    }
    return this.isConnected ? 'Firebase conectado' : 'Firebase desconectado';
  }
}