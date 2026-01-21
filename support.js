document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const ticketList = document.getElementById('ticketList');
    const sidebarHeader = document.getElementById('sidebarHeader');
    const newTicketForm = document.getElementById('newTicketForm');
    const ticketView = document.getElementById('ticketView');
    const createTicketForm = document.getElementById('createTicketForm');
    const successAlert = document.getElementById('successAlert');
    const chatArea = document.getElementById('chatArea');
    const replyForm = document.getElementById('replyForm');
    const viewSubject = document.getElementById('viewSubject');
    const viewId = document.getElementById('viewId');

    const ticketClosedMessage = document.getElementById('ticketClosedMessage');
    const viewStatus = document.getElementById('viewStatus');
    const closeTicketBtn = document.getElementById('closeTicketBtn');

    // --- State ---
    let tickets = JSON.parse(localStorage.getItem('vion_tickets')) || [];
    let activeTicketId = null;

    // --- Helpers ---
    function saveTickets() {
        localStorage.setItem('vion_tickets', JSON.stringify(tickets));
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // --- Render Functions ---
    function renderTicketList() {
        ticketList.innerHTML = '';
        const user = JSON.parse(localStorage.getItem('currentUser'));

        let displayTickets = tickets;
        if (user) {
            displayTickets = tickets.filter(t => t.username === user.username);
        } else {
            // For guest support page (if allowed), maybe show nothing or generic?
            // Assuming guest can keep non-persisted state unless we use cookies.
            // But for now, let's just show all local items if auth not fully strictly enforced on support page for demo
        }

        if (displayTickets.length === 0) {
            ticketList.innerHTML = '<div class="no-tickets">Henüz talep oluşturmadınız.</div>';
            return;
        }

        displayTickets.slice().reverse().forEach(ticket => {
            const div = document.createElement('div');
            div.className = `ticket-item ${activeTicketId === ticket.id ? 'active' : ''}`;
            div.onclick = () => openTicket(ticket.id);

            const statusColor = ticket.status === 'open' ? '#2ecc71' : '#e74c3c';

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <h4>${ticket.subject}</h4>
                    <span style="font-size: 10px; color: ${statusColor}; font-weight: bold;">${ticket.status === 'open' ? 'AÇIK' : 'KAPALI'}</span>
                </div>
                <span class="ticket-date">#${ticket.id} • ${formatDate(ticket.createdAt)}</span>
            `;
            ticketList.appendChild(div);
        });
    }

    function renderMessages(ticket) {
        chatArea.innerHTML = '';

        // Initial issue message
        addMessageBubble(ticket.message, 'user', ticket.createdAt);

        // Replies
        if (ticket.replies) {
            ticket.replies.forEach(reply => {
                addMessageBubble(reply.text, reply.sender, reply.createdAt);
            });
        }

        scrollToBottom();
    }

    function addMessageBubble(text, sender, date) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = `
            ${text}
            <span class="message-meta">${formatDate(date)}</span>
        `;
        chatArea.appendChild(div);
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // --- Actions ---
    function openTicket(id) {
        activeTicketId = id;
        const ticket = tickets.find(t => t.id === id);

        if (!ticket) return;

        // UI Updates
        newTicketForm.classList.add('hidden');
        ticketView.classList.remove('hidden');
        successAlert.classList.add('hidden');

        viewSubject.textContent = ticket.subject;
        viewId.textContent = `#${ticket.id}`;

        // Status Update
        if (ticket.status === 'closed') {
            viewStatus.textContent = "KAPALI";
            viewStatus.className = "status-badge closed";
            replyForm.classList.add('hidden');
            ticketClosedMessage.classList.remove('hidden');
            closeTicketBtn.classList.add('hidden'); // Hide close button if already closed
        } else {
            viewStatus.textContent = "AÇIK";
            viewStatus.className = "status-badge";
            replyForm.classList.remove('hidden');
            ticketClosedMessage.classList.add('hidden');
            closeTicketBtn.classList.remove('hidden');
        }

        renderTicketList(); // update active class
        renderMessages(ticket);
    }

    function showNewTicketForm() {
        activeTicketId = null;
        renderTicketList();
        ticketView.classList.add('hidden');
        newTicketForm.classList.remove('hidden');
        successAlert.classList.add('hidden');
    }

    const backToFormBtn = document.getElementById('backToFormBtn');

    // --- Event Listeners ---
    if (backToFormBtn) {
        backToFormBtn.addEventListener('click', showNewTicketForm);
    }

    // --- Modal Logic ---
    if (closeTicketBtn) {
        closeTicketBtn.addEventListener('click', () => {
            if (!activeTicketId) return;
            closeReason.value = ''; // Reset reason
            closeTicketModal.classList.remove('hidden');
        });
    }

    if (cancelCloseBtn) {
        cancelCloseBtn.addEventListener('click', () => {
            closeTicketModal.classList.add('hidden');
        });
    }

    if (confirmCloseBtn) {
        confirmCloseBtn.addEventListener('click', () => {
            const reason = closeReason.value.trim();
            if (!reason) {
                alert('Lütfen bir kapatma nedeni giriniz.');
                return;
            }

            const ticketIndex = tickets.findIndex(t => t.id === activeTicketId);
            if (ticketIndex > -1) {
                const ticket = tickets[ticketIndex];
                const user = JSON.parse(localStorage.getItem('currentUser'));

                // Determine who is closing
                let closerName = 'Admin';
                if (user && user.username === ticket.username) {
                    closerName = user.username;
                }

                // Update Ticket
                ticket.status = 'closed';

                // Add System Message about closing
                const closeMsg = {
                    text: `🔒 Talep <strong>${closerName}</strong> tarafından kapatıldı.<br>Neden: ${reason}`,
                    sender: 'system',
                    createdAt: new Date().toISOString()
                };

                if (!ticket.replies) ticket.replies = [];
                ticket.replies.push(closeMsg);

                saveTickets();

                closeTicketModal.classList.add('hidden');
                openTicket(activeTicketId); // Re-render view
            }
        });
    }

    createTicketForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Ensure user is logged in to attach username correctly if field is hidden or auto-filled
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const usernameInput = document.getElementById('username');
        const username = user ? user.username : (usernameInput ? usernameInput.value : 'Anonymous');

        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;

        const newTicket = {
            id: generateId(),
            username,
            subject,
            message,
            createdAt: new Date().toISOString(),
            status: 'open',
            replies: []
        };

        tickets.push(newTicket);
        saveTickets();

        // Reset Form
        createTicketForm.reset();

        // Show Success
        renderTicketList();
        successAlert.classList.remove('hidden');

        // Auto-switch to list update but keep on form for a moment to see success
        // Optional: could redirect to ticket view immediately
    });

    replyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeTicketId) return;

        const input = document.getElementById('replyInput');
        const text = input.value.trim();
        if (!text) return;

        const ticketIndex = tickets.findIndex(t => t.id === activeTicketId);
        if (ticketIndex === -1) return;

        const newReply = {
            text: text,
            sender: 'user', // In a real app check for admin login
            createdAt: new Date().toISOString()
        };

        tickets[ticketIndex].replies.push(newReply);
        saveTickets();

        addMessageBubble(text, 'user', newReply.createdAt);
        input.value = '';
        scrollToBottom();
    });

    // --- Initialization ---
    renderTicketList();
});
