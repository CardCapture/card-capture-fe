import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-24 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="opacity-70">Universities deserve better</span>
          <br />
          Students deserve better
        </h2>
        <p className="text-xl md:text-2xl opacity-90 mb-4">
          Built for college fairs, Ready for every student
        </p>
        <p className="text-sm opacity-75 mb-10">
          Also available with custom-branded inquiry cards for year-round recruitment
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-10 py-6"
            onClick={() => navigate('/get-started')}
          >
            Schedule a Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
