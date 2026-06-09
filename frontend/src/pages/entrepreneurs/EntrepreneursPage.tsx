import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

interface Entrepreneur {
  _id: string;
  name: string;
  email: string;
  role: string;
  profileData: {
    bio: string;
    history: string;
    preferences: string;
  };
  createdAt: string;
}

export const EntrepreneursPage: React.FC = () => {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('business_nexus_token');

  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      try {
        const res = await fetch(`${API_URL}/users/role/entrepreneur`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEntrepreneurs(data);
      } catch (err) {
        console.error('Failed to fetch entrepreneurs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntrepreneurs();
  }, []);

  const filtered = entrepreneurs.filter(e =>
    searchQuery === '' ||
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.profileData?.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover entrepreneurs registered on Nexus</p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, email, or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startAdornment={<Search size={18} />}
          fullWidth
        />
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm text-gray-600">{filtered.length} results</span>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading entrepreneurs...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No entrepreneurs found</p>
          <p className="text-sm text-gray-400 mt-1">Entrepreneurs need to register on Nexus to appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(entrepreneur => (
            <Card key={entrepreneur._id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-bold text-lg">
                      {entrepreneur.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{entrepreneur.name}</h3>
                    <p className="text-sm text-gray-500">{entrepreneur.email}</p>
                    {entrepreneur.profileData?.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {entrepreneur.profileData.bio}
                      </p>
                    )}
                    {entrepreneur.profileData?.history && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {entrepreneur.profileData.history}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/meetings`)}
                    className="flex-1 text-sm bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-md transition-colors"
                  >
                    Schedule Meeting
                  </button>
                  <button
                    onClick={() => navigate(`/messages`)}
                    className="flex-1 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-md transition-colors"
                  >
                    Message
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};