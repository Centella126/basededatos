document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA DETECTAR LA URL DEL SERVIDOR ---
    const REMOTE_BASE_URL = "https://salud-y-belleza-gema.onrender.com";
    const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168');
    const BASE_URL = IS_LOCALHOST ? "http://localhost:4000" : REMOTE_BASE_URL;
    // --- FIN DE LA LÓGICA DE URL ---

    const form = document.getElementById('pin-form');
    const inputs = document.querySelectorAll('.pin-input');
    const errorMessage = document.getElementById('error-message');
    
    // Auto-enfocar al siguiente campo de texto
    inputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            const currentInput = input;
            const nextInput = input.nextElementSibling;
            const prevInput = input.previousElementSibling;

            if (currentInput.value.length > 0 && nextInput) {
                nextInput.focus();
            } else if (e.key === 'Backspace' && prevInput) {
                prevInput.focus();
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let pin = '';
        inputs.forEach(input => { pin += input.value; });

        if (pin.length !== 4) {
            errorMessage.textContent = 'El PIN debe tener 4 dígitos.';
            errorMessage.classList.remove('hidden');
            return;
        }

        try {
            // Usamos la variable BASE_URL para la dirección correcta
            const res = await fetch(`${BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (res.ok) {
                sessionStorage.setItem('isAuthenticated', 'true');
                window.location.href = 'index.html'; // Redirigir a la app principal
            } else {
                const result = await res.json();
                errorMessage.textContent = result.message || 'PIN incorrecto.';
                errorMessage.classList.remove('hidden');
                form.reset();
                inputs[0].focus();
            }
        } catch (error) {
            errorMessage.textContent = 'Error de conexión con el servidor.';
            errorMessage.classList.remove('hidden');
        }
    });
});