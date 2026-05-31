import TicketForm from '@/components/TicketForm';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Submit a Support Ticket</h1>
        <p className="text-slate-500">Our AI triages your issue instantly — classifying it, setting priority, and drafting a professional response.</p>
      </div>
      <TicketForm />
    </div>
  );
}
