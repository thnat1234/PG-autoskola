include('./map1.js');

function include(filename)
{
    var head = document.getElementsByTagName('head')[0];

    var script = document.createElement('script');
    script.src = filename;
    script.type = 'text/javascript';

    head.appendChild(script)
}

function index(){

    $(document).ready(function () {
        if (document.cookie.indexOf('visited=true') == -1) {
            $('#myModal').modal({
                show: true
            });

            // var year = 1000 * 60 * 60 * 24 * 365;
            var year = 10;
            var expires = new Date((new Date()).valueOf() + year);
            document.cookie = "visited=true;expires=" + expires.toUTCString();

            map1();
        }

        
    });

    
    
}