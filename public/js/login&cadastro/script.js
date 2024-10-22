// Função para alternar a visibilidade da senha
function togglePassword(id) {
    var input = document.getElementById(id);
    var icon = document.querySelector(`span.eye-icon[onclick*='${id}'] i`);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
