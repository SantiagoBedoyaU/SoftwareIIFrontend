import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})


export class HomeComponent implements AfterViewInit {

  
  ngAfterViewInit() {
    // Inicializa el carrusel como slider de ancho completo
    const elems = document.querySelectorAll('.carousel');
    M.Carousel.init(elems, {
      fullWidth: true,  
      indicators: true, 
      duration: 200     
    });
  }
}