
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Eye, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { historyAPI } from '../../services/api';

interface HistoryEntry {
  id: string;
  record_id: string;
  changed_by: string;
  change_type: string;
  change_details: any;
  change_timestamp: string;
}

const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await historyAPI.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visit':
      case 'appointment':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'test':
      case 'lab_result':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'prescription':
      case 'medication':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'note':
      case 'update':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visit':
      case 'appointment':
        return 'bg-blue-100 text-blue-800';
      case 'test':
      case 'lab_result':
        return 'bg-green-100 text-green-800';
      case 'prescription':
      case 'medication':
        return 'bg-purple-100 text-purple-800';
      case 'note':
      case 'update':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatChangeType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderChangeDetails = (details: any) => {
    if (!details || typeof details !== 'object') {
      return <p className="text-gray-600">No additional details available.</p>;
    }

    const renderValue = (value: any): React.ReactNode => {
      if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-gray-500 italic">None</span>;
        return (
          <div className="space-y-1">
            {value.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
              </div>
            ))}
          </div>
        );
      }
      
      if (typeof value === 'object' && value !== null) {
        return (
          <div className="ml-4 space-y-2">
            {Object.entries(value).map(([key, val]) => (
              <div key={key} className="flex">
                <span className="font-medium text-gray-700 capitalize mr-2">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-900">{String(val)}</span>
              </div>
            ))}
          </div>
        );
      }
      
      return <span className="text-gray-900">{String(value)}</span>;
    };

    return (
      <div className="space-y-4">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="border-l-4 border-blue-200 pl-4">
            <h4 className="font-semibold text-gray-800 capitalize mb-2">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            {renderValue(value)}
          </div>
        ))}
      </div>
    );
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(entry => entry.change_type.toLowerCase().includes(filter.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Medical History</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Records' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === tab.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="space-y-6">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'You have no medical history records yet.'
                  : `No ${filter} records found.`
                }
              </p>
            </div>
          ) : (
            filteredHistory.map(entry => (
              <div key={entry.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(entry.change_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {formatChangeType(entry.change_type)}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(entry.change_type)}`}>
                            {formatChangeType(entry.change_type)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(entry.change_timestamp).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(entry.change_timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <p className="text-gray-700">
                          Medical record updated by healthcare provider
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(selectedEntry.change_type)}
                    <h3 className="text-xl font-semibold text-gray-900">
                      {formatChangeType(selectedEntry.change_type)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(selectedEntry.change_type)}`}>
                      {formatChangeType(selectedEntry.change_type)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date & Time
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedEntry.change_timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Record ID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{selectedEntry.record_id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Type
                    </label>
                    <p className="text-gray-900">{formatChangeType(selectedEntry.change_type)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Changed By
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{selectedEntry.changed_by}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Change Details
                  </label>
                  <div className="bg-gray-50 rounded-lg p-6">
                    {renderChangeDetails(selectedEntry.change_details)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
