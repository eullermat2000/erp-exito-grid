import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Search,
  FileText,
  Image,
  Download,
} from 'lucide-react';
import type { Document } from '@/types';

const mockDocuments: Document[] = [
  { id: '1', name: 'Projeto Elétrico - OB-001.pdf', fileName: 'projeto.pdf', type: 'project', mimeType: 'application/pdf', size: 2500000, createdAt: '2024-01-16', updatedAt: '2024-01-16', url: '#', version: 1 },
  { id: '2', name: 'ART - OB-001.pdf', fileName: 'art.pdf', type: 'other' as any, mimeType: 'application/pdf', size: 800000, createdAt: '2024-01-19', updatedAt: '2024-01-19', url: '#', version: 1 },
  { id: '3', name: 'Foto - Quadro Elétrico.jpg', fileName: 'quadro.jpg', type: 'photo' as any, mimeType: 'image/jpeg', size: 3200000, createdAt: '2024-02-10', updatedAt: '2024-02-10', url: '#', version: 1 },
  { id: '4', name: 'Memorial Descritivo OB-002.pdf', fileName: 'memorial.pdf', type: 'other' as any, mimeType: 'application/pdf', size: 1200000, createdAt: '2024-04-12', updatedAt: '2024-04-12', url: '#', version: 1 },
];

const categoryLabels: Record<string, { label: string; color: string; icon: any }> = {
  project: { label: 'Projeto', color: 'bg-blue-100 text-blue-700', icon: FileText },
  other: { label: 'Documento', color: 'bg-slate-100 text-slate-700', icon: FileText },
  photo: { label: 'Foto', color: 'bg-purple-100 text-purple-700', icon: Image },
};

export default function EmployeeDocuments() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus Documentos</h1>
          <p className="text-slate-500">Documentos das suas obras</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(categoryLabels).map(([key, config]) => {
          const Icon = config.icon;
          const count = documents.filter(d => (d.type as string) === key).length;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-slate-500">{count} arquivos</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => {
          const category = categoryLabels[doc.type as string];
          const Icon = category?.icon || FileText;
          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category?.color || 'bg-slate-100'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={doc.name}>{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{category?.label || (doc.type as string)}</Badge>
                      <span className="text-xs text-slate-500">{formatSize(doc.size || 0)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
