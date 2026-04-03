import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private socket: SocketService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.auth.init();
    if (await this.auth.isAuthenticated()) {
      this.socket.connect();
    }
  }
}
