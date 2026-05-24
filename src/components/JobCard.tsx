import { MapPin, Clock, Briefcase } from "lucide-react";

interface JobCardProps {
  title: string;
  location: string;
  type: string;
  department: string;
}

const JobCard = ({ title, location, type, department }: JobCardProps) => (
  <div className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer group">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{department}</p>
      </div>
      <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full">{type}</span>
    </div>
    <div className="flex gap-4 mt-4 text-muted-foreground text-xs">
      <span className="flex items-center gap-1"><MapPin size={14} /> {location}</span>
      <span className="flex items-center gap-1"><Clock size={14} /> Publicado hoje</span>
      <span className="flex items-center gap-1"><Briefcase size={14} /> CLT</span>
    </div>
  </div>
);

export default JobCard;
