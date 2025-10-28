import { defineField } from "sanity";
import { createPreview } from "../../utils/preview";

export default {
    name: 'ThisIsName',
    title: 'This Is Name',
    type: 'object',
    fields: [
                 
                
                
                 
                 defineField({
            name: 'stuff',
            type: 'object',
            fields: [
                         
                        
                        
                         
                        
                        
                         
                        
                        
            ]
        }),
         
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 defineField({
            name: 'ref',
            type: 'reference',
            to: [],
        }),  
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
    ],
    preview: createPreview('This Is Name'),
}