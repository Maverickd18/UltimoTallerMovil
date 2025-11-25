// src/app/shared/components/custom-button/custom-button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-button',
  templateUrl: './custom-button.component.html',
  styleUrls: ['./custom-button.component.scss'],
  standalone: false
})
export class CustomButtonComponent {
  @Input() text: string = 'Button';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() color: string = 'primary';
  @Input() expand: 'block' | 'full' = 'block';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;
  @Input() iconPosition: 'start' | 'end' = 'start';
  @Input() fill: 'clear' | 'outline' | 'solid' = 'solid';
  @Input() size: 'small' | 'default' | 'large' = 'default';

  @Output() clicked = new EventEmitter<void>();

  onClick() {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}