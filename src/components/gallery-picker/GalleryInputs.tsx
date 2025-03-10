
import { Input } from "@/components/ui/input";
import { GalleryInputsProps } from "./types";

const GalleryInputs = ({ handleFileChange, handleDirectorySelect }: GalleryInputsProps) => {
  return (
    <>
      <Input 
        id="gallery-file-input" 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
        multiple
      />
      
      <Input 
        id="gallery-auto-scan-input" 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden"
        multiple
      />
      
      <Input 
        id="gallery-directory-input" 
        type="file" 
        accept="image/*" 
        onChange={handleDirectorySelect}
        className="hidden"
        multiple
        webkitdirectory="true"
      />
    </>
  );
};

export default GalleryInputs;
