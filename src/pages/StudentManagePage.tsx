import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { SmartPhoneInput } from '@/components/ui/smart-phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { StudentService } from '@/services';
import { validators } from '@/utils/validation';
import { Save, CheckCircle } from 'lucide-react';

const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export default function StudentManagePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrDataUri, setQrDataUri] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preferred_first_name: '',
    email: '',
    cell: '',
    address: '',
    address_2: '',
    city: '',
    state: '',
    zip_code: '',
    high_school: '',
    grade_level: '',
    grad_year: '',
    gpa: '',
    sat_score: '',
    act_score: '',
    major: '',
  });

  useEffect(() => {
    if (!token) {
      setError('No token provided. Please use the link from your email or text message.');
      setLoading(false);
      return;
    }
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    try {
      const data = await StudentService.getStudentByToken(token);
      setQrDataUri(data.qrDataUri);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        preferred_first_name: data.preferred_first_name || '',
        email: data.email || '',
        cell: data.cell || '',
        address: data.address || '',
        address_2: data.address_2 || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        high_school: data.high_school || '',
        grade_level: data.grade_level || '',
        grad_year: data.grad_year?.toString() || '',
        gpa: data.gpa?.toString() || '',
        sat_score: data.sat_score?.toString() || '',
        act_score: data.act_score?.toString() || '',
        major: data.major || '',
      });
    } catch {
      setError('This link is invalid or has expired. Use the lookup page to get a new one.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await StudentService.updateStudentByToken(token, {
        ...formData,
        gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
        sat_score: formData.sat_score ? parseInt(formData.sat_score) : undefined,
        act_score: formData.act_score ? parseInt(formData.act_score) : undefined,
      });
      setSaved(true);
      toast({ title: 'Profile saved', description: 'Your information has been updated.' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-3">Link Expired</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/lookup"
              className="inline-block bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Lookup Page
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 px-4">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">CardCapture</h1>
          <p className="text-gray-600 mt-1">Your QR Code & Profile</p>
        </div>

        {/* QR Code Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-6 flex flex-col items-center">
            {qrDataUri && (
              <img
                src={qrDataUri}
                alt="Your QR Code"
                className="w-56 h-56 mb-4"
              />
            )}
            <p className="text-sm text-gray-600 text-center">
              Show this QR code at any college booth using CardCapture to share your info.
            </p>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Tip: Take a screenshot to save to your photos
            </p>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField({ first_name: e.target.value })}
                />
                <FormInput
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField({ last_name: e.target.value })}
                />
              </div>

              <FormInput
                label="Preferred Name"
                name="preferred_first_name"
                value={formData.preferred_first_name}
                onChange={(e) => updateField({ preferred_first_name: e.target.value })}
                placeholder="Optional"
              />

              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField({ email: e.target.value })}
                onValidate={validators.email}
              />

              <SmartPhoneInput
                label="Phone"
                value={formData.cell}
                onChange={(value) => updateField({ cell: value })}
                onValidate={validators.phone}
              />

              <FormInput
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={(e) => updateField({ address: e.target.value })}
              />

              <FormInput
                label="Address Line 2"
                name="address_2"
                value={formData.address_2}
                onChange={(e) => updateField({ address_2: e.target.value })}
                placeholder="Apt, Suite, etc."
              />

              <div className="grid grid-cols-3 gap-3">
                <FormInput
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={(e) => updateField({ city: e.target.value })}
                />
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => updateField({ state: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormInput
                  label="ZIP"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => updateField({ zip_code: e.target.value })}
                  onValidate={validators.zipCode}
                />
              </div>

              <FormInput
                label="High School"
                name="high_school"
                value={formData.high_school}
                onChange={(e) => updateField({ high_school: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="GPA"
                  name="gpa"
                  value={formData.gpa}
                  onChange={(e) => updateField({ gpa: e.target.value })}
                  onValidate={validators.gpa}
                />
                <FormInput
                  label="Intended Major"
                  name="major"
                  value={formData.major}
                  onChange={(e) => updateField({ major: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="SAT Score"
                  name="sat_score"
                  value={formData.sat_score}
                  onChange={(e) => updateField({ sat_score: e.target.value })}
                  onValidate={(v) => validators.testScore(v, 'SAT')}
                />
                <FormInput
                  label="ACT Score"
                  name="act_score"
                  value={formData.act_score}
                  onChange={(e) => updateField({ act_score: e.target.value })}
                  onValidate={(v) => validators.testScore(v, 'ACT')}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by CardCapture
        </p>
      </div>
    </div>
  );
}
