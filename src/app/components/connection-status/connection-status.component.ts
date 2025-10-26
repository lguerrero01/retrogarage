import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Wifi, WifiOff, RefreshCw } from 'lucide-angular';
import { WebSocketService } from '../../services/websocket.service';
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

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit() {
    this.subscription = this.webSocketService.connectionStatus$.subscribe(status => {
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
    this.webSocketService.reconnect();
    
    // Reset reconnecting state after 5 seconds if still not connected
    setTimeout(() => {
      if (!this.isConnected) {
        this.isReconnecting = false;
      }
    }, 5000);
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
    return this.isConnected ? 'Conectado' : 'Desconectado';
  }
}