import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    detected: 0,
    sent: 0,
    unsubscribed: 0
  });

  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subscriptions`);
      setSubscriptions(response.data);
      updateStats(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (subscriptions) => {
    const stats = {
      total: subscriptions.length,
      detected: subscriptions.filter(sub => sub.status === 'detected').length,
      sent: subscriptions.filter(sub => sub.status === 'unsubscribe_sent').length,
      unsubscribed: subscriptions.filter(sub => sub.status === 'unsubscribed').length
    };
    setStats(stats);
  };

  const handleScanEmail = async () => {
    setScanning(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/scan-email`);
      console.log('Scan initiated:', response.data);
      // In a real app, you'd poll for scan status
      setTimeout(() => {
        fetchSubscriptions();
        setScanning(false);
      }, 3000);
    } catch (error) {
      console.error('Error scanning email:', error);
      setScanning(false);
    }
  };

  const handleGenerateEmail = async (subscriptionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-unsubscribe-email/${subscriptionId}`);
      const emailData = response.data;
      
      // Show preview modal or directly send
      if (window.confirm(`Envoyer cet email de désinscription ?\n\nÀ: ${emailData.to}\nObjet: ${emailData.subject}`)) {
        await handleSendUnsubscribe(subscriptionId, emailData);
      }
    } catch (error) {
      console.error('Error generating email:', error);
    }
  };

  const handleSendUnsubscribe = async (subscriptionId, emailContent) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/send-unsubscribe`, {
        subscription_id: subscriptionId,
        email_content: emailContent.email_content || emailContent
      });
      console.log('Unsubscribe email sent:', response.data);
      fetchSubscriptions(); // Refresh the list
    } catch (error) {
      console.error('Error sending unsubscribe email:', error);
    }
  };

  const handleUpdateStatus = async (subscriptionId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/subscriptions/${subscriptionId}/status`, {
        status: newStatus
      });
      fetchSubscriptions(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'detected':
        return 'bg-blue-100 text-blue-800';
      case 'unsubscribe_sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'unsubscribed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'detected':
        return 'Détecté';
      case 'unsubscribe_sent':
        return 'Email envoyé';
      case 'unsubscribed':
        return 'Désinscrit';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                📧 Application de Désinscription
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleScanEmail}
                disabled={scanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {scanning ? '🔍 Scan en cours...' : '🔍 Scanner mes emails'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📧</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🔍</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Détectés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.detected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📤</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Envoyés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Désinscris</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unsubscribed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Abonnements détectés ({subscriptions.length})
            </h2>
          </div>
          
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Chargement...</div>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-500 text-center">
                  <p className="text-lg mb-2">Aucun abonnement détecté</p>
                  <p className="text-sm">Cliquez sur "Scanner mes emails" pour commencer</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <li key={subscription.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {subscription.service_name}
                          </h3>
                          <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                            {getStatusText(subscription.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          📧 {subscription.sender_email}
                        </p>
                        <p className="text-sm text-gray-500">
                          🗓️ Détecté le {new Date(subscription.detected_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {subscription.status === 'detected' && (
                          <button
                            onClick={() => handleGenerateEmail(subscription.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Générer email
                          </button>
                        )}
                        
                        {subscription.status === 'unsubscribe_sent' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'unsubscribed')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Marquer comme désinscrit
                          </button>
                        )}
                        
                        {subscription.status === 'unsubscribed' && (
                          <span className="text-green-600 font-medium">
                            ✅ Terminé
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Getting Started Guide */}
        {subscriptions.length === 0 && !loading && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              🚀 Comment commencer
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Connectez-vous à votre compte Gmail (OAuth sécurisé)</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Cliquez sur "Scanner mes emails" pour détecter automatiquement les abonnements</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Générez et envoyez des emails de désinscription personnalisés</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Suivez le statut de vos demandes de désinscription</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;