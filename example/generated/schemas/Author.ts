import { defineField } from "sanity";
import { createPreview } from "../../utils/preview";

export default {
    name: 'Author',
    title: 'Author',
    type: 'object',
    fields: [
                 
                
                
                 
                
                
                 
                
                
                 
                 defineField({
            name: 'socialLinks',
            type: 'object',
            fields: [
                         
                        
                        
                         
                        
                        
                         
                        
                        
            ]
        }),
         
                
                 
                
                
    ],
    preview: createPreview('Author'),
}