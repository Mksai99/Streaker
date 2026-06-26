import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Store, MapPin, Globe, Clock, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { api, shopApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const step1Schema = z.object({
  name: z.string().min(2, "Shop name is required"),
  description: z.string().min(10, "Please provide a brief description"),
  category: z.string().min(2, "Category is required"),
  gstNumber: z.string().optional(),
  yearEstablished: z.string().optional(),
});

const step2Schema = z.object({
  ownerName: z.string().min(2, "Owner name is required"),
  ownerEmail: z.string().email("Valid email is required"),
  ownerMobile: z.string().min(10, "Valid mobile number is required"),
  alternateContact: z.string().optional(),
});

const step3Schema = z.object({
  address: z.string().min(5, "Full address is required"),
  landmark: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  pincode: z.string().min(4, "Valid pincode is required"),
});

const step4Schema = z.object({
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  whatsappNumber: z.string().optional(),
  openingTime: z.string().min(4, "Required"),
  closingTime: z.string().min(4, "Required"),
  averageCapacity: z.string().optional(),
});

const steps = [
  { id: 'basic', title: 'Basic Info', icon: Store, schema: step1Schema },
  { id: 'owner', title: 'Owner Info', icon: CheckCircle2, schema: step2Schema },
  { id: 'location', title: 'Location', icon: MapPin, schema: step3Schema },
  { id: 'business', title: 'Business', icon: Clock, schema: step4Schema },
];

export default function ShopRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentSchema = steps[currentStep].schema;
  const { register, handleSubmit, formState: { errors }, trigger } = useRHForm({
    resolver: zodResolver(currentSchema),
    defaultValues: formData,
  });

  const onNext = async (data) => {
    const isValid = await trigger();
    if (!isValid) return;

    setFormData((prev) => ({ ...prev, ...data }));
    
    if (currentStep === steps.length - 1) {
      submitRegistration({ ...formData, ...data });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const onPrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const submitRegistration = async (finalData) => {
    setIsSubmitting(true);
    try {
      await shopApi.create(finalData);
      toast.success('Shop registered successfully!');
      navigate('/shop/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to register shop');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Register Your Business</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Join Streakify and start managing your customer loyalty</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-800">
            <div 
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-500"
            ></div>
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            {steps.map((step, idx) => (
              <div key={step.id} className={`${idx <= currentStep ? 'text-primary-600' : ''}`}>
                {step.title}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden p-6 sm:p-8">
          <form onSubmit={handleSubmit(onNext)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Basic Info */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shop Name</label>
                      <input {...register('name')} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <textarea {...register('description')} rows={3} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500"></textarea>
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <select {...register('category')} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500">
                        <option value="">Select Category</option>
                        <option value="cafe">Cafe / Coffee Shop</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="gym">Gym / Fitness</option>
                        <option value="salon">Salon / Spa</option>
                        <option value="supermarket">Supermarket</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                    </div>
                  </div>
                )}

                {/* Step 2: Owner Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner Full Name</label>
                      <input {...register('ownerName')} defaultValue={user?.displayName || ''} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                      {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                      <input {...register('ownerEmail')} type="email" defaultValue={user?.email || ''} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                      {errors.ownerEmail && <p className="text-red-500 text-xs mt-1">{errors.ownerEmail.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                      <input {...register('ownerMobile')} type="tel" className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                      {errors.ownerMobile && <p className="text-red-500 text-xs mt-1">{errors.ownerMobile.message}</p>}
                    </div>
                  </div>
                )}

                {/* Step 3: Location */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Address</label>
                      <textarea {...register('address')} rows={2} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500"></textarea>
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                        <input {...register('city')} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                        <input {...register('state')} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                        <input {...register('country')} defaultValue="India" className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                        {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pincode</label>
                        <input {...register('pincode')} className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                        {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Business Hours & Online */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Time</label>
                        <input type="time" {...register('openingTime')} defaultValue="09:00" className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Closing Time</label>
                        <input type="time" {...register('closingTime')} defaultValue="21:00" className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website URL (Optional)</label>
                      <input {...register('website')} type="url" placeholder="https://" className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</label>
                      <input {...register('whatsappNumber')} type="tel" className="mt-1 w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={onPrev}
                  className="flex items-center px-6 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" /> Back
                </button>
              ) : <div></div>}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                {currentStep === steps.length - 1 ? (
                  isSubmitting ? 'Submitting...' : 'Complete Registration'
                ) : (
                  <>Next <ChevronRight className="w-5 h-5 ml-1" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
