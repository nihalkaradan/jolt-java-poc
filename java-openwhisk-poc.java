import com.google.gson.JsonObject;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonArray;
import com.bazaarvoice.jolt.Chainr;
import com.bazaarvoice.jolt.JsonUtils;

import java.io.IOException;
import java.util.List; 
public class Hello {
    public static JsonObject main(JsonObject args) {
        String spec="";
        String input="";
        if (args.has("spec")&&args.has("input")) {
            
            
            Gson g = new Gson();
            
            //System.out.println(args.get("spec").toString().getClass().getName());
            spec =args.get("spec").toString();
            input = args.get("input").toString();
        }
        
        List chainrSpecJSON = JsonUtils.jsonToList( spec);
        Chainr chainr = Chainr.fromSpec( chainrSpecJSON );

        Object inputJSON = JsonUtils.jsonToObject(input);
        Object transformedOutput = chainr.transform( inputJSON );
        System.out.println(transformedOutput);
        JsonObject response = new JsonObject();
        response.addProperty("Transformed output",JsonUtils.toJsonString( transformedOutput ));
        return response;
//      JsonObject response = new JsonObject();
//       response.addProperty("out","out");
//       return response;
    }
}
