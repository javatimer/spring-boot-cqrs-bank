import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard-skeleton',
  imports: [MatCardModule],
  templateUrl: './dashboard-skeleton.html',
  styleUrl: './dashboard-skeleton.scss'
})
export class DashboardSkeleton { }